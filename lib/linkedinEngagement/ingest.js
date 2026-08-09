// lib/linkedinEngagement/ingest.js
//
// Orchestrates one daily engagement-tracking run: list recent posts, tag
// each with its source (spec section "Post surfaces to cover"), pull
// reactions+comments per post, and upsert everything idempotently. A
// per-post or per-engagement failure is logged and skipped rather than
// aborting the whole run; only a failure in listRecentPosts itself (the
// first call) fails the run outright, since nothing else can proceed
// without it.
import { listRecentPosts, getPostReactions, getPostComments } from "./unipileClient.js";
import { detectSource } from "./detectSource.js";
import { normalizeReaction, normalizeComment } from "./normalize.js";

function firstDefined(obj, paths) {
  for (const path of paths) {
    const value = path.split(".").reduce((acc, key) => acc?.[key], obj);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

// CONFIRMED against a live Unipile response (2026-08-09):
// - linkedinUrn comes from `social_id` (the stable URN) - per Unipile's own
//   docs, social_id is required for all follow-up actions (reactions,
//   comments) since LinkedIn exposes multiple IDs for the same post and
//   only social_id is reliable across all of them.
// - url comes from `share_url`.
// - postedAt comes from `parsed_datetime` (ISO) - the sibling `date` field
//   is a relative string like "1d" and is not usable as a timestamp.
// - text comes from `text`.
// Older candidate names are kept as fallbacks in case a post type (e.g. a
// repost) varies from what was inspected.
function extractPostFields(rawPost) {
  const linkedinUrn = firstDefined(rawPost, ["social_id", "urn", "id"]);
  const url = firstDefined(rawPost, ["share_url", "url", "permalink"]);
  const postedAtRaw = firstDefined(rawPost, ["parsed_datetime", "posted_at", "created_at"]);
  const text = firstDefined(rawPost, ["text", "commentary", "content"]);

  if (!linkedinUrn || !url) return null;

  const postedAt = postedAtRaw ? new Date(postedAtRaw) : new Date();

  return {
    linkedinUrn: String(linkedinUrn),
    url: String(url),
    postedAt: Number.isNaN(postedAt.getTime()) ? new Date() : postedAt,
    textSnippet: text ? String(text).slice(0, 300) : null,
  };
}

// fullName/headline are populated opportunistically from whatever
// reaction/comment data happened to include them (both do, per
// normalize.js) - this is a free byproduct of Phase 1 ingestion, not the
// deferred Phase 2 enrichment call. Existing non-null values are never
// overwritten with weaker/null data, so a later real enrichment pass (if
// built) still wins.
async function upsertProfileStub(tx, { linkedinUrn, publicUrl, fullName, headline }) {
  const existing = await tx.engagementProfile.findUnique({ where: { linkedinUrn } });
  if (existing) {
    const patch = {};
    if (!existing.publicUrl && publicUrl) patch.publicUrl = publicUrl;
    if (!existing.fullName && fullName) patch.fullName = fullName;
    if (!existing.headline && headline) patch.headline = headline;
    if (Object.keys(patch).length === 0) return existing;
    return tx.engagementProfile.update({ where: { id: existing.id }, data: patch });
  }
  try {
    return await tx.engagementProfile.create({
      data: { linkedinUrn, publicUrl: publicUrl || null, fullName: fullName || null, headline: headline || null },
    });
  } catch (err) {
    // Race with another concurrent run, or publicUrl collided with a
    // different profile's - fall back to whatever's there under this URN.
    if (err?.code === "P2002") {
      const retry = await tx.engagementProfile.findUnique({ where: { linkedinUrn } });
      if (retry) return retry;
    }
    throw err;
  }
}

async function upsertEngagement(tx, { postId, profileId, type, commentText, reactedAt }) {
  try {
    await tx.engagementRecord.create({
      data: { postId, profileId, type, commentText, reactedAt },
    });
    return true; // newly created
  } catch (err) {
    if (err?.code === "P2002") return false; // already recorded, idempotent no-op
    throw err;
  }
}

export async function runIngestion(prisma, { limit = 50 } = {}) {
  const run = await prisma.engagementSyncRun.create({ data: {} });

  let postsScanned = 0;
  let newEngagements = 0;
  const warnings = [];

  try {
    const rawPosts = await listRecentPosts({ limit });

    for (const rawPost of rawPosts) {
      const fields = extractPostFields(rawPost);
      if (!fields) {
        warnings.push("Skipped a post with no resolvable urn/url");
        continue;
      }

      const { source, confident } = detectSource(rawPost);

      const post = await prisma.engagementPost.upsert({
        where: { linkedinUrn: fields.linkedinUrn },
        update: { url: fields.url, textSnippet: fields.textSnippet },
        create: {
          linkedinUrn: fields.linkedinUrn,
          url: fields.url,
          postedAt: fields.postedAt,
          textSnippet: fields.textSnippet,
          source,
          sourceConfident: confident,
        },
      });
      postsScanned++;

      let rawReactions = [];
      let rawComments = [];
      try {
        rawReactions = await getPostReactions(fields.linkedinUrn);
      } catch (err) {
        warnings.push(`Reactions fetch failed for ${fields.linkedinUrn}: ${err.message}`);
      }
      try {
        rawComments = await getPostComments(fields.linkedinUrn);
      } catch (err) {
        warnings.push(`Comments fetch failed for ${fields.linkedinUrn}: ${err.message}`);
      }

      const normalized = [
        ...rawReactions.map(normalizeReaction),
        ...rawComments.map(normalizeComment),
      ].filter(Boolean);

      for (const record of normalized) {
        const profile = await upsertProfileStub(prisma, {
          linkedinUrn: record.linkedinUrn,
          publicUrl: record.publicUrl,
          fullName: record.fullName,
          headline: record.headline,
        });
        const created = await upsertEngagement(prisma, {
          postId: post.id,
          profileId: profile.id,
          type: record.type,
          commentText: record.commentText,
          reactedAt: record.reactedAt,
        });
        if (created) newEngagements++;
      }
    }

    await prisma.engagementSyncRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        postsScanned,
        newEngagements,
        errorMessage: warnings.length > 0 ? warnings.join("; ").slice(0, 2000) : null,
      },
    });

    return { runId: run.id, postsScanned, newEngagements, warnings };
  } catch (err) {
    await prisma.engagementSyncRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), postsScanned, newEngagements, errorMessage: err.message.slice(0, 2000) },
    });
    throw err;
  }
}

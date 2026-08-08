// lib/linkedinAgent/handoff.js
// Spec section 14: the literal handoff contract between the Generation Agent
// and the Publishing Agent.
import { buildIdempotencyKey } from "./idempotency.js";

export class HandoffError extends Error {
  constructor(reasonCode, message, postIds = []) {
    super(message);
    this.name = "HandoffError";
    this.reasonCode = reasonCode;
    this.postIds = postIds;
  }
}

// Phase 1 has no per-destination scheduling-window data source (no tz
// library dependency added), so the publish window is approximated as
// 09:00-17:00 UTC on the theme's publish date. This is a documented
// simplification: spec section 7.4's time-window enforcement is a soft
// warning only in Phase 1 (see preflight.js), never a hard block.
function computePublishWindow(postDate) {
  const day = new Date(postDate);
  const earliestPublishAt = new Date(day);
  earliestPublishAt.setUTCHours(9, 0, 0, 0);
  const latestPublishAt = new Date(day);
  latestPublishAt.setUTCHours(17, 0, 0, 0);
  return { earliestPublishAt, latestPublishAt };
}

// Literal spec section 14.1 eligibility expression, evaluated against a
// fully-loaded job (with campaign/theme/generatedPost/destination included).
export function checkHandoffEligibility(job) {
  const reasons = [];
  if (job.campaign.status !== "READY_TO_PUBLISH") reasons.push("campaign.status != ready_to_publish");
  if (job.theme.status !== "READY_TO_PUBLISH") reasons.push("theme.status != ready_to_publish");
  if (job.generatedPost.validationStatus !== "PASSED") reasons.push("generated_post.validation_status != passed");
  if (job.generatedPost.approvalStatus !== "LOCKED") reasons.push("generated_post.approval_status != locked");
  if (job.generatedPost.contentHash !== job.generatedPost.lockedContentHash) {
    reasons.push("generated_post.content_hash != generated_post.locked_content_hash");
  }
  if (job.destination.status !== "ACTIVE") reasons.push("destination.active != true");
  return { eligible: reasons.length === 0, reasons };
}

export async function lockCampaignAndCreateJobs(prisma, campaignId, actor = "admin") {
  return prisma.$transaction(async (tx) => {
    const campaign = await tx.contentCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      throw new HandoffError("DATABASE_WRITE_FAILURE", "Campaign not found.", []);
    }

    const posts = await tx.generatedPost.findMany({
      where: { campaignId },
      include: {
        theme: { include: { topic: true, asset: true } },
        destination: true,
      },
    });

    if (posts.length === 0) {
      throw new HandoffError("GENERATION_INCOMPLETE", "No generated posts found for this campaign.", []);
    }

    const notApproved = posts.filter(
      (p) => p.approvalStatus !== "APPROVED" && p.approvalStatus !== "LOCKED"
    );
    if (notApproved.length > 0) {
      throw new HandoffError(
        "GENERATION_INCOMPLETE",
        "Not every generated post is approved yet.",
        notApproved.map((p) => p.id)
      );
    }

    // No separate "edited after approval" timestamp check is needed here:
    // PATCH /api/linkedin/posts/[id] already reverts approvalStatus to DRAFT
    // on any postText edit, so the notApproved filter above already rejects
    // any post that was edited since it was last approved.

    // Batched writes (updateMany/createMany) instead of one query per post -
    // a large campaign (e.g. 10 days x 9 groups = 110 placements) looping
    // individual queries inside a single interactive transaction can exceed
    // Prisma's default 5s transaction timeout.
    const notYetLocked = posts.filter((p) => p.approvalStatus !== "LOCKED");
    if (notYetLocked.length > 0) {
      await tx.generatedPost.updateMany({
        where: { id: { in: notYetLocked.map((p) => p.id) } },
        data: { approvalStatus: "LOCKED" },
      });
      // lockedContentHash must be set per-post (each post's own contentHash),
      // which updateMany can't express - batch via one query per distinct
      // hash value instead of per-post.
      const byHash = new Map();
      for (const post of notYetLocked) {
        if (!byHash.has(post.contentHash)) byHash.set(post.contentHash, []);
        byHash.get(post.contentHash).push(post.id);
      }
      for (const [contentHash, ids] of byHash) {
        await tx.generatedPost.updateMany({
          where: { id: { in: ids } },
          data: { lockedContentHash: contentHash },
        });
      }
    }

    const jobsData = posts.map((post) => {
      const idempotencyKey = buildIdempotencyKey({
        generatedPostId: post.id,
        copyVersion: post.copyVersion,
        destinationId: post.destinationId,
      });
      const { theme, destination } = post;
      const { earliestPublishAt, latestPublishAt } = computePublishWindow(theme.postDate);
      const sourceVersion = theme.postType === "INSIGHT" ? theme.topic?.version : theme.asset?.version;

      return {
        idempotencyKey,
        campaignId: campaign.id,
        themeId: theme.id,
        generatedPostId: post.id,
        copyVersion: post.copyVersion,
        destinationId: destination.id,
        destinationType: destination.destinationType,
        linkedinReference: destination.linkedinReference,
        publishingMode: destination.publishingMode,
        status: "QUEUED",
        publishDate: theme.postDate,
        earliestPublishAt,
        latestPublishAt,
        timezone: campaign.timezone,
        sequence: 0,
        contentTextSnapshot: post.postText,
        canonicalUrl: post.urlIncluded,
        publishedUrl: null,
        mediaAssetId: null,
        contentHash: post.contentHash,
        postType: post.postType,
        topicId: theme.topicId,
        assetId: theme.assetId,
        sourceVersion: sourceVersion ?? null,
        approvedBy: post.approvedBy,
        approvedAt: post.approvedAt,
      };
    });

    const allKeys = jobsData.map((j) => j.idempotencyKey);
    const existing = await tx.publishingJob.findMany({
      where: { idempotencyKey: { in: allKeys } },
      select: { idempotencyKey: true },
    });
    const existingKeySet = new Set(existing.map((row) => row.idempotencyKey));

    // skipDuplicates on the unique idempotencyKey is what makes repeated
    // lock calls idempotent (AC-12) - no per-row upsert needed.
    await tx.publishingJob.createMany({ data: jobsData, skipDuplicates: true });

    // Every post in the campaign was just confirmed APPROVED/LOCKED above,
    // so every theme it belongs to is fully locked too.
    const themeIds = [...new Set(posts.map((p) => p.themeId))];
    await tx.campaignTheme.updateMany({
      where: { id: { in: themeIds } },
      data: { status: "READY_TO_PUBLISH" },
    });

    await tx.contentCampaign.update({
      where: { id: campaignId },
      data: { status: "READY_TO_PUBLISH" },
    });

    await tx.contentApproval.create({
      data: {
        campaignId,
        level: "CAMPAIGN",
        action: "LOCK",
        approver: actor,
      },
    });

    return {
      campaignId,
      jobCount: jobsData.length,
      createdCount: jobsData.filter((j) => !existingKeySet.has(j.idempotencyKey)).length,
      alreadyExistedCount: jobsData.filter((j) => existingKeySet.has(j.idempotencyKey)).length,
    };
  });
}

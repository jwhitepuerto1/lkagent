// lib/linkedinEngagement/normalize.js
//
// Turns raw Unipile reaction/comment payloads into the normalized shape
// ingest.js writes to the database. Field names below are CONFIRMED against
// a live Unipile response (2026-08-09), not guessed:
//
// Reaction: { value: "LIKE"|"PRAISE"|..., author: { id, name, headline,
//             profile_url, ... } } - no timestamp field exists at all.
// Comment:  { text, date (ISO), author: "<display name>" (a STRING, not an
//             object), author_details: { id, headline, profile_url, ... } }
//   Note the comment shape's `author` field is the person's name, while the
//   real profile id/url live under `author_details` - easy to get backwards.
//
// fullName/headline are captured here as a free byproduct of ingestion, not
// a separate enrichment call - see ingest.js's upsertProfileStub for how
// this interacts with the (still-deferred) Phase 2 enrichment fields.

function toDateOrNow(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function normalizeReaction(rawReaction) {
  const author = rawReaction.author || {};
  if (!author.id) return null;

  const type = String(rawReaction.value || "").toUpperCase() === "LIKE" ? "LIKE" : "REACTION_OTHER";

  return {
    linkedinUrn: String(author.id),
    publicUrl: author.profile_url || null,
    fullName: author.name || null,
    headline: author.headline || null,
    type,
    // Empty string, not null: Postgres unique constraints treat every NULL
    // as distinct from every other NULL, so @@unique([postId, profileId,
    // type, commentText]) would silently fail to dedupe repeat LIKEs across
    // runs if this were null. "" participates in uniqueness correctly.
    commentText: "",
    // Unipile's reaction payload has no timestamp field at all (confirmed,
    // not an extraction miss) - this is necessarily ingestion time, not the
    // actual moment of the reaction. EngagementRecord.discoveredAt records
    // the same thing more honestly; reactedAt is kept for schema parity
    // with comments, which do have a real date.
    reactedAt: new Date(),
  };
}

export function normalizeComment(rawComment) {
  const details = rawComment.author_details || {};
  if (!details.id) return null;

  return {
    linkedinUrn: String(details.id),
    publicUrl: details.profile_url || null,
    fullName: typeof rawComment.author === "string" ? rawComment.author : null,
    headline: details.headline || null,
    type: "COMMENT",
    commentText: rawComment.text ? String(rawComment.text) : "",
    reactedAt: toDateOrNow(rawComment.date),
  };
}

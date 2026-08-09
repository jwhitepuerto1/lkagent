// lib/linkedinEngagement/postIdResolver.js
// Best-effort: John pastes a LinkedIn post URL (or a raw social_id/URN) for
// a post he commented on. Unipile's own docs say the reliable path is
// "extract the id visible in the URL, then call GET /posts/{id} and take
// social_id from the result" - this has not been verified against a live
// pasted URL yet (see docs/linkedin-engagement/README.md).
import { getPost } from "./unipileClient.js";

const URN_PATTERN = /urn:li:(?:activity|groupPost|ugcPost):[\w-]+/i;
const ACTIVITY_SLUG_PATTERN = /-activity-(\d+)-/;

export async function resolvePostSocialId(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) return null;

  const urnMatch = trimmed.match(URN_PATTERN);
  if (urnMatch) return urnMatch[0];

  const slugMatch = trimmed.match(ACTIVITY_SLUG_PATTERN);
  const candidateId = slugMatch ? slugMatch[1] : trimmed;

  const post = await getPost(candidateId);
  const socialId = post?.social_id;
  if (!socialId) {
    throw new Error(`Could not resolve a social_id for "${input}" - paste the exact post URL or its urn:li:... identifier.`);
  }
  return socialId;
}

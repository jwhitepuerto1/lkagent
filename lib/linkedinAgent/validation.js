// lib/linkedinAgent/validation.js
// Spec section 11 validation pipeline. Checks that map to spec table
// "Block" outcomes fail the post outright (validationStatus=FAILED).
// Checks that map to "Review or regenerate" outcomes (SIMILARITY,
// DESTINATION_VOICE, CTA_MATCH) are recorded but do not block approval —
// they surface as review flags in the UI instead, per the Phase-1
// simplification agreed in the plan (no auto-regeneration loop).
import { highestSimilarity } from "./similarity.js";

export const BLOCKING_CHECK_CODES = new Set([
  "REQUIRED_FIELDS",
  "SOURCE_ACTIVE",
  "DESTINATION_ACTIVE",
  "URL_SYNTAX",
  "CHAR_LIMIT",
  "URL_PLACEMENT",
  "DUPLICATE_CONTENT",
]);

function result(checkCode, passed, reasonCode = null, message = "", details = null) {
  return { checkCode, passed, reasonCode, message, details };
}

export function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function checkRequiredFields(post) {
  const ok = Boolean(post.postText && post.postText.trim().length > 0);
  return result(
    "REQUIRED_FIELDS",
    ok,
    ok ? null : "GENERATION_INCOMPLETE",
    ok ? "" : "Post text is empty."
  );
}

function checkSourceActive(theme, topic, asset) {
  if (theme.postType === "INSIGHT") {
    const ok = Boolean(topic?.active);
    return result("SOURCE_ACTIVE", ok, ok ? null : "SOURCE_CONFLICT", ok ? "" : "Topic is inactive.");
  }
  const ok = Boolean(asset?.active && asset?.sourceCopy);
  return result(
    "SOURCE_ACTIVE",
    ok,
    ok ? null : "ASSET_COPY_MISSING",
    ok ? "" : "Asset is inactive or missing approved source copy."
  );
}

function checkDestinationActive(destination) {
  const ok = destination.status === "ACTIVE";
  return result(
    "DESTINATION_ACTIVE",
    ok,
    ok ? null : "DESTINATION_RULE_FAILURE",
    ok ? "" : `Destination status is ${destination.status}.`
  );
}

function checkUrlSyntax(post) {
  if (post.postType === "INSIGHT") {
    return result("URL_SYNTAX", true);
  }
  const ok = Boolean(post.urlIncluded) && isValidUrl(post.urlIncluded);
  return result(
    "URL_SYNTAX",
    ok,
    ok ? null : "URL_INVALID",
    ok ? "" : "Asset post is missing a syntactically valid URL."
  );
}

function checkCharLimit(post, charLimit) {
  const ok = post.postText.length <= charLimit;
  return result(
    "CHAR_LIMIT",
    ok,
    ok ? null : "DESTINATION_RULE_FAILURE",
    ok ? "" : `Post is ${post.postText.length} characters, limit is ${charLimit}.`,
    { length: post.postText.length, limit: charLimit }
  );
}

function checkUrlPlacement(post, destination) {
  if (post.postType === "INSIGHT" || !post.urlIncluded) {
    return result("URL_PLACEMENT", true);
  }
  const lines = post.postText.split("\n").filter((l) => l.trim().length > 0);
  const urlLineIndexes = lines
    .map((line, idx) => (line.includes(post.urlIncluded) ? idx : -1))
    .filter((idx) => idx !== -1);

  if (urlLineIndexes.length === 0) {
    return result(
      "URL_PLACEMENT",
      false,
      "DESTINATION_RULE_FAILURE",
      "URL text was not found in the post body."
    );
  }

  if (destination.urlPlacementPolicy === "top_and_bottom") {
    const nearTop = urlLineIndexes.some((idx) => idx <= 1);
    const nearBottom = urlLineIndexes.some((idx) => idx >= lines.length - 2);
    const ok = nearTop && nearBottom && urlLineIndexes.length >= 1;
    return result(
      "URL_PLACEMENT",
      ok,
      ok ? null : "DESTINATION_RULE_FAILURE",
      ok ? "" : "URL must appear near the top and again near the bottom for this destination."
    );
  }

  const ok = urlLineIndexes.every((idx) => idx >= lines.length - 2);
  return result(
    "URL_PLACEMENT",
    ok,
    ok ? null : "DESTINATION_RULE_FAILURE",
    ok ? "" : "URL must appear only near the end for this destination."
  );
}

function checkDuplicateContent(post, candidates) {
  const exact = candidates.find((c) => c.id !== post.id && c.contentHash === post.contentHash);
  return result(
    "DUPLICATE_CONTENT",
    !exact,
    exact ? "DUPLICATE_CONTENT" : null,
    exact ? "Exact duplicate of another recent post for this destination." : "",
    exact ? { matchId: exact.id } : null
  );
}

function checkSimilarity(post, candidates, threshold) {
  const others = candidates.filter((c) => c.id !== post.id);
  const { maxScore, matchId } = highestSimilarity(post.postText, others);
  const ok = maxScore < threshold;
  return result(
    "SIMILARITY",
    ok,
    ok ? null : "HIGH_SIMILARITY",
    ok ? "" : `Similarity score ${maxScore.toFixed(2)} exceeds threshold ${threshold}.`,
    { score: maxScore, matchId }
  );
}

// Lightweight heuristic only — flag for human review, never blocks approval.
function checkDestinationVoice(post, destination) {
  const text = post.postText.toLowerCase();
  let suspicious = false;
  let message = "";

  if (destination.destinationType === "COMPANY" && /\bi am\b|\bi've\b|\bmy own\b/.test(text)) {
    suspicious = true;
    message = "Company post reads first-person singular — check institutional voice.";
  }
  if (
    destination.destinationType === "PERSONAL" &&
    /\bwe are pleased to announce\b|\bour organization\b/.test(text)
  ) {
    suspicious = true;
    message = "Personal post reads institutional — check first-person voice.";
  }

  return result("DESTINATION_VOICE", !suspicious, null, message);
}

// Simple keyword heuristic — flag for human review, never blocks approval.
function checkCtaMatch(post, theme) {
  const cta = (theme.ctaConcept || "").toLowerCase();
  if (!cta) return result("CTA_MATCH", true);
  const text = post.postText.toLowerCase();
  const ctaWords = cta.split(/\s+/).filter((w) => w.length > 4);
  const anyMatch = ctaWords.length === 0 || ctaWords.some((w) => text.includes(w));
  return result(
    "CTA_MATCH",
    anyMatch,
    null,
    anyMatch ? "" : "Post text does not appear to reflect the planned CTA concept."
  );
}

// candidates: other GeneratedPost rows for the same destination within the
// duplicate-lookback window (caller fetches via Prisma).
export function runValidationForPost({ post, theme, topic, asset, destination, candidates, platformConfig }) {
  const checks = [
    checkRequiredFields(post),
    checkSourceActive(theme, topic, asset),
    checkDestinationActive(destination),
    checkUrlSyntax(post),
    checkCharLimit(post, platformConfig.linkedinCharLimit),
    checkUrlPlacement(post, destination),
    checkDuplicateContent(post, candidates),
    checkSimilarity(post, candidates, platformConfig.similarityThreshold),
    checkDestinationVoice(post, destination),
    checkCtaMatch(post, theme),
  ];

  const blockingFailure = checks.some(
    (check) => !check.passed && BLOCKING_CHECK_CODES.has(check.checkCode)
  );

  return { checks, validationStatus: blockingFailure ? "FAILED" : "PASSED" };
}

export function runVariantCountCheck(theme, expectedCount, actualCount) {
  const passed = actualCount === expectedCount;
  return result(
    "VARIANT_COUNT",
    passed,
    passed ? null : "GENERATION_INCOMPLETE",
    passed ? "" : `Expected ${expectedCount} variants, found ${actualCount}.`,
    { expected: expectedCount, actual: actualCount }
  );
}

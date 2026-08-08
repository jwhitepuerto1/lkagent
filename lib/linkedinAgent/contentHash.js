// lib/linkedinAgent/contentHash.js
import crypto from "crypto";

// Trim + collapse whitespace + lowercase so trivial formatting diffs still
// count as the same content for duplicate detection.
export function normalizeText(text) {
  return String(text || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function computeContentHash(text) {
  return crypto.createHash("sha256").update(normalizeText(text)).digest("hex");
}

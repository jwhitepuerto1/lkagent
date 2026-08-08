// lib/linkedinAgent/similarity.js
// Plain-JS semantic-similarity stand-in (spec section 10): character trigram
// Jaccard similarity over normalized text. No external NLP service, no vector
// column — computed on demand against a candidate pool.
import { normalizeText } from "./contentHash.js";

export function trigramSet(text) {
  const normalized = normalizeText(text).replace(/[^a-z0-9 ]/g, "");
  const set = new Set();
  for (let i = 0; i <= normalized.length - 3; i++) {
    set.add(normalized.slice(i, i + 3));
  }
  return set;
}

export function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const gram of setA) {
    if (setB.has(gram)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Returns { maxScore, matchId } against a pool of { id, postText }.
export function highestSimilarity(text, candidates) {
  const target = trigramSet(text);
  let maxScore = 0;
  let matchId = null;
  for (const candidate of candidates) {
    const score = jaccardSimilarity(target, trigramSet(candidate.postText));
    if (score > maxScore) {
      maxScore = score;
      matchId = candidate.id;
    }
  }
  return { maxScore, matchId };
}

// lib/linkedinAgent/idempotency.js
// Spec section 14.3: the Generation Agent must never create two active
// publishing jobs with the same key.
export function buildIdempotencyKey({ generatedPostId, copyVersion, destinationId }) {
  return `publish:${generatedPostId}:${copyVersion}:${destinationId}`;
}

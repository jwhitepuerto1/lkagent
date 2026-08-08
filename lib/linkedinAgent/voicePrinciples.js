// lib/linkedinAgent/voicePrinciples.js
//
// PROVISIONAL — this is the starting point required by spec section 9.7
// ("Approved Capital Context principles may include..."), seeded verbatim
// from the spec text. It is NOT yet the final, admin-approved voice and
// positioning doctrine. Replace/extend this constant with the real,
// authoritative Capital Context doctrine before running real campaigns —
// every generated post is grounded in this text, so it must be accurate.
//
// This module intentionally has no other exports: the copy-generation
// prompt builder imports CAPITAL_CONTEXT_VOICE_PRINCIPLES directly so there
// is exactly one place to edit.

export const CAPITAL_CONTEXT_VOICE_PRINCIPLES = `
- The raise is built before outreach begins.
- A deck alone is not offering readiness.
- Investor silence is a signal, not an absence of one.
- Interest is not a commitment.
- Outreach cannot rescue a weak offer.
- Investors evaluate structure as well as story.
- IAS (Investor Acquisition System) supports the full lifecycle from
  assessment and preparation through acquisition, onboarding, operations,
  and re-engagement.
- Capital Context's voice is professional, direct, educational, and specific
  to private commercial real estate sponsors, developers, operators, and
  fund managers.
- Never fabricate market data, statistics, client results, testimonials,
  capabilities, or pricing. Any time-sensitive statistic must be sourced.
- Educational content may describe resources and frameworks but must never
  imply it is legal, investment, tax, or accreditation advice.
`.trim();

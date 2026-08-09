// lib/linkedinEngagement/scoring.js
// Deterministic scoring (spec 3.5 requires this NOT be left to the LLM).
// This is a lightweight LinkedIn-side proxy, not the rigorous evidence-based
// fit engine described in the separate ias_cre_agent/IAM modules - it exists
// to prioritize John's limited daily manual actions, not to replace those
// systems' scoring.

// Spec 7.5.B initial engagement-score weights, applied to whichever signals
// are true for this person.
const ENGAGEMENT_WEIGHTS = {
  repliedToDm: 30,
  commentedOnOurPost: 20,
  acceptedInvitation: 15,
  engagedAcrossMultiplePosts: 12,
  reactedToPost: 10,
  unrelatedRole: -30,
};

export function computeEngagementScore(signals) {
  const factors = [];
  let score = 0;

  if (signals.repliedToDm) {
    score += ENGAGEMENT_WEIGHTS.repliedToDm;
    factors.push({ label: "Replied to a LinkedIn DM", points: ENGAGEMENT_WEIGHTS.repliedToDm });
  }
  if (signals.commentedOnOurPost) {
    score += ENGAGEMENT_WEIGHTS.commentedOnOurPost;
    factors.push({ label: "Commented on a Capital Context or John post", points: ENGAGEMENT_WEIGHTS.commentedOnOurPost });
  }
  if (signals.acceptedInvitation) {
    score += ENGAGEMENT_WEIGHTS.acceptedInvitation;
    factors.push({ label: "Accepted an invitation", points: ENGAGEMENT_WEIGHTS.acceptedInvitation });
  }
  if (signals.engagedAcrossMultiplePosts) {
    score += ENGAGEMENT_WEIGHTS.engagedAcrossMultiplePosts;
    factors.push({ label: "Engaged across multiple posts", points: ENGAGEMENT_WEIGHTS.engagedAcrossMultiplePosts });
  }
  if (signals.reactedToPost) {
    score += ENGAGEMENT_WEIGHTS.reactedToPost;
    factors.push({ label: "Reacted to a post", points: ENGAGEMENT_WEIGHTS.reactedToPost });
  }
  if (signals.unrelatedRole) {
    score += ENGAGEMENT_WEIGHTS.unrelatedRole;
    factors.push({ label: "Unrelated role", points: ENGAGEMENT_WEIGHTS.unrelatedRole });
  }

  return { score, factors };
}

// Category -> baseline fit band. Categories 1-4 (potential IAS client
// prospects) score highest; category 8 (investor contact) scores low here
// deliberately, since that population routes to a different workflow
// entirely, not the sponsor-fit track.
const CATEGORY_FIT_BASE = {
  CRE_SPONSOR_DEVELOPER: 90,
  REAL_ESTATE_FUND_MANAGER: 88,
  REAL_ESTATE_SYNDICATOR: 86,
  CRE_OPERATOR: 82,
  CAPITAL_RAISING_ADVISOR: 65,
  SECURITIES_OR_RE_ATTORNEY: 60,
  CPA_TAX_ADVISOR: 55,
  INVESTOR_CONTACT: 30,
  CRE_SERVICE_PROVIDER: 40,
  INDUSTRY_PUBLICATION_OR_INFLUENCER: 35,
  UNRELATED_LOW_RELEVANCE: 5,
  UNCLEAR_REVIEW_REQUIRED: 20,
};

export function computeFitScore(category, confidence = 0.5) {
  const base = CATEGORY_FIT_BASE[category] ?? 20;
  const score = Math.round(base * (0.5 + 0.5 * confidence));
  return {
    score,
    factors: [
      { label: `Category: ${category}`, points: base },
      { label: `Classification confidence ${(confidence * 100).toFixed(0)}%`, points: score - base },
    ],
  };
}

// Recency: full weight inside 7 days, decaying to zero by 60 days (spec
// 7.5.C - "weight recent activity more strongly than old activity").
function recencyMultiplier(lastInboundAt) {
  if (!lastInboundAt) return 0;
  const days = (Date.now() - new Date(lastInboundAt).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 7) return 1;
  if (days >= 60) return 0;
  return 1 - (days - 7) / 53;
}

export function computePriorityScore({ fitScore, engagementScore, lastInboundAt }) {
  const recency = recencyMultiplier(lastInboundAt);
  const raw = fitScore * 0.4 + Math.max(0, engagementScore) * 0.4 + recency * 100 * 0.2;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  return {
    score,
    factors: [
      { label: "Fit score contribution", points: Math.round(fitScore * 0.4) },
      { label: "Engagement score contribution", points: Math.round(Math.max(0, engagementScore) * 0.4) },
      { label: "Recency contribution", points: Math.round(recency * 100 * 0.2) },
    ],
  };
}

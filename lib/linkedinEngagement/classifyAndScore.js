// lib/linkedinEngagement/classifyAndScore.js
// Orchestrates one profile's classify+score pass. Manual overrides
// (classificationOverridden=true) are never re-classified by the LLM - the
// human value is authoritative until deliberately reset (spec 7.4).
import { classifyPerson } from "./classify.js";
import { computeEngagementScore, computeFitScore, computePriorityScore } from "./scoring.js";

export async function classifyAndScoreProfile(prisma, profileId) {
  const profile = await prisma.engagementProfile.findUnique({
    where: { id: profileId },
    include: { engagements: true, invites: true, conversations: true, commentReplies: true },
  });
  if (!profile) throw new Error("Profile not found");

  let category = profile.primaryCategory;
  let secondaryCategories = profile.secondaryCategories;
  let confidence = profile.classificationConfidence;
  let evidence = profile.classificationEvidence;

  if (!profile.classificationOverridden) {
    const contextText =
      [
        ...profile.engagements.filter((e) => e.commentText).map((e) => e.commentText),
        ...profile.commentReplies.map((r) => r.replyText),
      ]
        .slice(0, 3)
        .join(" | ") || null;

    const result = await classifyPerson({
      fullName: profile.fullName,
      headline: profile.headline,
      companyName: profile.companyName,
      location: profile.location,
      contextText,
    });
    category = result.primaryCategory;
    secondaryCategories = result.secondaryCategories;
    confidence = result.confidence;
    evidence = result.evidence;
  }

  const distinctPostIds = new Set(profile.engagements.map((e) => e.postId));
  const signals = {
    repliedToDm: profile.conversations.some((c) => c.lastInboundAt),
    commentedOnOurPost: profile.engagements.some((e) => e.type === "COMMENT"),
    acceptedInvitation: profile.invites.some((i) => i.status === "ACCEPTED"),
    engagedAcrossMultiplePosts: distinctPostIds.size > 1,
    reactedToPost: profile.engagements.some((e) => e.type === "LIKE" || e.type === "REACTION_OTHER"),
    unrelatedRole: category === "UNRELATED_LOW_RELEVANCE",
  };

  const engagement = computeEngagementScore(signals);
  const fit = computeFitScore(category, confidence ?? 0.5);
  const priority = computePriorityScore({
    fitScore: fit.score,
    engagementScore: engagement.score,
    lastInboundAt: profile.lastInboundAt,
  });

  const nextStatus =
    profile.status === "LINKEDIN_LEAD" && (signals.repliedToDm || signals.commentedOnOurPost)
      ? "ENGAGEMENT_REVIEW"
      : profile.status;

  return prisma.engagementProfile.update({
    where: { id: profileId },
    data: {
      primaryCategory: category,
      secondaryCategories,
      classificationConfidence: confidence,
      classificationEvidence: evidence,
      fitScore: fit.score,
      engagementScore: engagement.score,
      priorityScore: priority.score,
      scoreFactors: { engagement: engagement.factors, fit: fit.factors, priority: priority.factors },
      scoreCalculatedAt: new Date(),
      status: nextStatus,
    },
  });
}

// Classifies every profile that has never been scored, or optionally all
// profiles (forceAll) when signals have changed since the last pass.
export async function classifyAndScoreBatch(prisma, { forceAll = false, limit = 100 } = {}) {
  const profiles = await prisma.engagementProfile.findMany({
    where: forceAll ? {} : { scoreCalculatedAt: null },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  let succeeded = 0;
  const errors = [];
  for (const profile of profiles) {
    try {
      await classifyAndScoreProfile(prisma, profile.id);
      succeeded++;
    } catch (err) {
      errors.push({ profileId: profile.id, error: err.message });
    }
  }
  return { scanned: profiles.length, succeeded, errors };
}

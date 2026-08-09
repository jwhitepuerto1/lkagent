// pages/api/linkedin-engagement/queues.js
// Spec 7.7 daily action queues, trimmed to what this agent actually tracks
// (no enrichment/duplicate-review queues - those belong to ias_cre_agent).
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";
import { resolveOwnIdentifier } from "../../../lib/linkedinEngagement/unipileClient.js";

const RECENT_DAYS = 3;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);

    const [
      repliesRequiringAttention,
      commentRepliesAwaiting,
      newComments,
      newReactions,
      newlyAcceptedInvitations,
      followUpsDue,
    ] = await Promise.all([
      prisma.outreachConversation.findMany({
        where: { requiresMyResponse: true },
        include: { profile: true },
        orderBy: { lastInboundAt: "desc" },
      }),
      prisma.outreachCommentReply.findMany({
        where: { discoveredAt: { gte: since } },
        include: { profile: true, outreachComment: true },
        orderBy: { discoveredAt: "desc" },
      }),
      prisma.engagementRecord.findMany({
        where: { type: "COMMENT", discoveredAt: { gte: since } },
        include: { profile: true, post: true },
        orderBy: { discoveredAt: "desc" },
      }),
      prisma.engagementRecord.findMany({
        where: { type: { in: ["LIKE", "REACTION_OTHER"] }, discoveredAt: { gte: since } },
        include: { profile: true, post: true },
        orderBy: { discoveredAt: "desc" },
        take: 100,
      }),
      prisma.outreachInvite.findMany({
        where: { status: "ACCEPTED", resolvedAt: { gte: since } },
        include: { profile: true },
        orderBy: { resolvedAt: "desc" },
      }),
      prisma.engagementProfile.findMany({
        where: { nextActionDue: { lte: new Date() }, suppressed: false },
        orderBy: { nextActionDue: "asc" },
      }),
    ]);

    // Spec 7.8's 20/20/20 support, limited to what's actually derivable from
    // data this agent has: people who engaged but have no invite/connection
    // yet, and accepted connections with no DM sent yet. "Prospect posts
    // worth commenting on" is NOT included - no Unipile endpoint discovers
    // other people's posts, so producing this queue would mean fabricating
    // it; reporting zero honestly (spec 7.8: "show the smaller qualified
    // set rather than fill the queue with low-quality records").
    // The connected account's own reactions/comments on its own content
    // sometimes attribute back to its own profile - never recommend
    // inviting or DMing yourself.
    let ownIdentifier = null;
    try {
      ownIdentifier = await resolveOwnIdentifier();
    } catch {
      // Non-fatal - candidate lists just won't self-exclude this run.
    }
    const excludeSelf = ownIdentifier ? { linkedinUrn: { not: ownIdentifier } } : {};

    const [invitationCandidates, dmCandidates] = await Promise.all([
      prisma.engagementProfile.findMany({
        where: {
          suppressed: false,
          ...excludeSelf,
          // NOT: { connectionDeg: "FIRST_DEGREE" } would exclude NULL rows
          // too under plain SQL "!=" semantics (NULL is neither equal nor
          // not-equal to anything) - most profiles have connectionDeg=null
          // (never confirmed), and those should count as candidates, so
          // null is explicitly included via the OR below.
          OR: [{ connectionDeg: null }, { connectionDeg: { not: "FIRST_DEGREE" } }],
          invites: { none: {} },
          engagements: { some: {} },
        },
        orderBy: { priorityScore: "desc" },
        take: 20,
      }),
      prisma.engagementProfile.findMany({
        where: {
          suppressed: false,
          ...excludeSelf,
          conversations: { none: {} },
          OR: [{ connectionDeg: "FIRST_DEGREE" }, { invites: { some: { status: "ACCEPTED" } } }],
        },
        orderBy: { priorityScore: "desc" },
        take: 20,
      }),
    ]);

    // Priority ordering within replies: higher priorityScore first (spec 7.7
    // default priority order puts "a relevant prospect who replied" at #1).
    repliesRequiringAttention.sort(
      (a, b) => (b.profile.priorityScore ?? 0) - (a.profile.priorityScore ?? 0)
    );

    return res.status(200).json({
      repliesRequiringAttention,
      commentRepliesAwaiting,
      newComments,
      newReactions,
      newlyAcceptedInvitations,
      followUpsDue,
      invitationCandidates,
      dmCandidates,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

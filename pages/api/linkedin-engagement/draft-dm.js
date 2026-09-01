// pages/api/linkedin-engagement/draft-dm.js
// POST { profileId } -> { draftText }. Generates suggested DM text for one
// profile; nothing is sent or persisted - regenerate on demand, copy/paste
// into LinkedIn yourself. See lib/linkedinEngagement/draftDm.js for why this
// stays draft-only.
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";
import { draftDmMessage } from "../../../lib/linkedinEngagement/draftDm.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const profileId = String(req.body?.profileId || "");
    if (!profileId) return res.status(400).json({ error: "profileId is required" });

    const profile = await prisma.engagementProfile.findUnique({ where: { id: profileId } });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // Most recent engagement gives the drafter something real to reference
    // instead of writing a generic opener.
    const lastEngagement = await prisma.engagementRecord.findFirst({
      where: { profileId },
      include: { post: true },
      orderBy: { reactedAt: "desc" },
    });

    let engagementContext = null;
    if (lastEngagement) {
      const postDesc = lastEngagement.post?.textSnippet
        ? `your post "${lastEngagement.post.textSnippet.slice(0, 120)}"`
        : "one of your posts";
      engagementContext =
        lastEngagement.type === "COMMENT"
          ? `They commented "${lastEngagement.commentText}" on ${postDesc}.`
          : `They reacted to ${postDesc}.`;
    }

    const draftText = await draftDmMessage({
      fullName: profile.fullName,
      headline: profile.headline,
      companyName: profile.companyName,
      primaryCategory: profile.primaryCategory,
      engagementContext,
    });

    return res.status(200).json({ draftText });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

// pages/api/linkedin/posts/[id]/approve.js
import prisma from "../../../../../lib/prisma.js";
import { requireAuth } from "../../../../../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { id } = req.query;
  const actor = session.sub || "admin";

  try {
    const post = await prisma.generatedPost.findUnique({
      where: { id },
      include: { theme: { include: { topic: true, asset: true } } },
    });
    if (!post) return res.status(404).json({ error: "Not found" });
    if (post.validationStatus !== "PASSED") {
      return res.status(400).json({ error: "GENERATION_INCOMPLETE", message: "Post must pass validation before it can be approved." });
    }

    const sourceVersion = post.theme.postType === "INSIGHT" ? post.theme.topic?.version : post.theme.asset?.version;
    const approvedAt = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.generatedPost.update({
        where: { id },
        data: { approvalStatus: "APPROVED", approvedBy: actor, approvedAt },
      });
      await tx.contentApproval.create({
        data: {
          campaignId: post.campaignId,
          themeId: post.themeId,
          generatedPostId: post.id,
          level: "PLACEMENT",
          action: "APPROVE",
          approver: actor,
          copyVersion: post.copyVersion,
          sourceVersion: sourceVersion ?? null,
        },
      });
      return u;
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

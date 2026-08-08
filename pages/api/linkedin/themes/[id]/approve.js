// pages/api/linkedin/themes/[id]/approve.js
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
    const theme = await prisma.campaignTheme.findUnique({
      where: { id },
      include: { topic: true, asset: true, generatedPosts: true },
    });
    if (!theme) return res.status(404).json({ error: "Not found" });

    const notPassed = theme.generatedPosts.filter((p) => p.validationStatus !== "PASSED");
    if (notPassed.length > 0) {
      return res.status(400).json({ error: "GENERATION_INCOMPLETE", message: "All placements must pass validation before theme approval." });
    }

    const sourceVersion = theme.postType === "INSIGHT" ? theme.topic?.version : theme.asset?.version;
    const approvedAt = new Date();
    const toApprove = theme.generatedPosts.filter(
      (p) => p.approvalStatus !== "APPROVED" && p.approvalStatus !== "LOCKED"
    );

    await prisma.$transaction(async (tx) => {
      if (toApprove.length > 0) {
        await tx.generatedPost.updateMany({
          where: { id: { in: toApprove.map((p) => p.id) } },
          data: { approvalStatus: "APPROVED", approvedBy: actor, approvedAt },
        });
        await tx.contentApproval.createMany({
          data: toApprove.map((post) => ({
            campaignId: theme.campaignId,
            themeId: theme.id,
            generatedPostId: post.id,
            level: "PLACEMENT",
            action: "APPROVE",
            approver: actor,
            copyVersion: post.copyVersion,
            sourceVersion: sourceVersion ?? null,
          })),
        });
      }
      await tx.contentApproval.create({
        data: {
          campaignId: theme.campaignId,
          themeId: theme.id,
          level: "THEME",
          action: "APPROVE",
          approver: actor,
        },
      });
    });

    const updatedTheme = await prisma.campaignTheme.findUnique({
      where: { id },
      include: { generatedPosts: true },
    });
    return res.status(200).json(updatedTheme);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

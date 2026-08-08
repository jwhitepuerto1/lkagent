// pages/api/linkedin/campaigns/[id]/approve.js
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
    const campaign = await prisma.contentCampaign.findUnique({
      where: { id },
      include: {
        generatedPosts: true,
        themes: { include: { topic: true, asset: true } },
      },
    });
    if (!campaign) return res.status(404).json({ error: "Not found" });

    if (campaign.generatedPosts.length === 0) {
      return res.status(400).json({ error: "GENERATION_INCOMPLETE", message: "No generated posts to approve." });
    }
    const notPassed = campaign.generatedPosts.filter((p) => p.validationStatus !== "PASSED");
    if (notPassed.length > 0) {
      return res.status(400).json({ error: "GENERATION_INCOMPLETE", message: `${notPassed.length} post(s) have not passed validation.` });
    }

    const themeById = new Map(campaign.themes.map((t) => [t.id, t]));
    const approvedAt = new Date();
    const toApprove = campaign.generatedPosts.filter(
      (p) => p.approvalStatus !== "APPROVED" && p.approvalStatus !== "LOCKED"
    );

    // Batched writes (updateMany/createMany) instead of one query per post -
    // a 40+ post campaign looping individual queries inside a single
    // interactive transaction can exceed Prisma's default 5s timeout.
    await prisma.$transaction(async (tx) => {
      if (toApprove.length > 0) {
        await tx.generatedPost.updateMany({
          where: { id: { in: toApprove.map((p) => p.id) } },
          data: { approvalStatus: "APPROVED", approvedBy: actor, approvedAt },
        });
        await tx.contentApproval.createMany({
          data: toApprove.map((post) => {
            const theme = themeById.get(post.themeId);
            const sourceVersion = theme?.postType === "INSIGHT" ? theme?.topic?.version : theme?.asset?.version;
            return {
              campaignId: campaign.id,
              themeId: post.themeId,
              generatedPostId: post.id,
              level: "PLACEMENT",
              action: "APPROVE",
              approver: actor,
              copyVersion: post.copyVersion,
              sourceVersion: sourceVersion ?? null,
            };
          }),
        });
      }
      await tx.contentApproval.create({
        data: { campaignId: campaign.id, level: "CAMPAIGN", action: "APPROVE", approver: actor },
      });
      await tx.contentCampaign.update({ where: { id: campaign.id }, data: { status: "APPROVED" } });
    });

    const updated = await prisma.contentCampaign.findUnique({ where: { id } });
    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

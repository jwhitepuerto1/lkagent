// pages/api/linkedin/themes/[id]/replace-source.js
// Swaps the topic/asset backing a theme and clears its previously generated
// posts so copy can be regenerated from the new source. Only allowed before
// the campaign has been locked (no PublishingJob rows exist yet for this theme).
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
  const { topicId, assetId } = req.body || {};

  try {
    const theme = await prisma.campaignTheme.findUnique({
      where: { id },
      include: { generatedPosts: true },
    });
    if (!theme) return res.status(404).json({ error: "Not found" });

    if (theme.generatedPosts.some((p) => p.approvalStatus === "LOCKED")) {
      return res.status(409).json({
        error: "APPROVAL_HASH_MISMATCH",
        message: "This theme is already locked for publishing and can no longer have its source replaced.",
      });
    }

    if (theme.postType === "INSIGHT") {
      if (!topicId) return res.status(400).json({ error: "REQUIRED_FIELDS", message: "topicId is required for an insight theme" });
      const topic = await prisma.insightTopic.findUnique({ where: { id: topicId } });
      if (!topic || !topic.active) return res.status(400).json({ error: "SOURCE_CONFLICT", message: "Topic is not active" });
    } else {
      if (!assetId) return res.status(400).json({ error: "REQUIRED_FIELDS", message: "assetId is required for an asset theme" });
      const asset = await prisma.educationalAsset.findUnique({ where: { id: assetId } });
      if (!asset || !asset.active) return res.status(400).json({ error: "ASSET_COPY_MISSING", message: "Asset is not active" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.generatedPost.deleteMany({ where: { themeId: id } });
      return tx.campaignTheme.update({
        where: { id },
        data: {
          topicId: theme.postType === "INSIGHT" ? topicId : null,
          assetId: theme.postType === "ASSET" ? assetId : null,
          status: "DRAFT",
        },
      });
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DATABASE_WRITE_FAILURE", message: err?.message });
  }
}

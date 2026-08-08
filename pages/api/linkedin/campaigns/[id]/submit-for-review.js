// pages/api/linkedin/campaigns/[id]/submit-for-review.js
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

  try {
    const campaign = await prisma.contentCampaign.findUnique({
      where: { id },
      include: { generatedPosts: true, themes: true },
    });
    if (!campaign) return res.status(404).json({ error: "Not found" });

    if (campaign.generatedPosts.length === 0) {
      return res.status(400).json({ error: "GENERATION_INCOMPLETE", message: "No generated posts to review." });
    }

    const notPassed = campaign.generatedPosts.filter((p) => p.validationStatus !== "PASSED");
    if (notPassed.length > 0) {
      return res.status(400).json({
        error: "GENERATION_INCOMPLETE",
        message: `${notPassed.length} post(s) have not passed validation. Run Validate and fix failures first.`,
      });
    }

    const notReady = campaign.themes.filter((t) => t.status === "VALIDATION_FAILED");
    if (notReady.length > 0) {
      return res.status(400).json({ error: "GENERATION_INCOMPLETE", message: "Some themes failed validation." });
    }

    const updated = await prisma.contentCampaign.update({ where: { id }, data: { status: "IN_REVIEW" } });
    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

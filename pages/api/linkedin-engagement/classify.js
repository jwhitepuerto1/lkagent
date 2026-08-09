// pages/api/linkedin-engagement/classify.js
// POST { profileId } to classify one profile, or POST {} / { forceAll } to
// batch-classify unscored profiles.
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";
import { classifyAndScoreProfile, classifyAndScoreBatch } from "../../../lib/linkedinEngagement/classifyAndScore.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { profileId, forceAll } = req.body || {};
    if (profileId) {
      const updated = await classifyAndScoreProfile(prisma, profileId);
      return res.status(200).json(updated);
    }
    const result = await classifyAndScoreBatch(prisma, { forceAll: Boolean(forceAll) });
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

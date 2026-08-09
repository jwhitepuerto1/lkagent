// pages/api/linkedin-engagement/classify.js
// POST { profileId } to classify one profile, or POST {} / { forceAll } to
// batch-classify unscored profiles. Accepts either the staff session cookie
// (manual trigger) or the shared secret header (n8n), same pattern as
// run.js and sync-outreach.js.
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";
import { classifyAndScoreProfile, classifyAndScoreBatch } from "../../../lib/linkedinEngagement/classifyAndScore.js";

function isAuthorized(req) {
  const secret = process.env.LINKEDIN_ENGAGEMENT_INGEST_SECRET;
  const provided = req.headers["x-ingest-secret"];
  return Boolean(secret) && provided === secret;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  if (!isAuthorized(req)) {
    const session = requireAuth(req, res);
    if (!session) return;
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

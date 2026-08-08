// pages/api/linkedin/campaigns/[id]/lock.js
// The handoff (spec section 14): idempotent by design — calling this twice
// produces the same set of PublishingJob rows both times.
import prisma from "../../../../../lib/prisma.js";
import { requireAuth } from "../../../../../lib/auth.js";
import { HandoffError, lockCampaignAndCreateJobs } from "../../../../../lib/linkedinAgent/handoff.js";

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
    const result = await lockCampaignAndCreateJobs(prisma, id, actor);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof HandoffError) {
      return res.status(409).json({ error: err.reasonCode, message: err.message, postIds: err.postIds });
    }
    console.error(err);
    return res.status(500).json({ error: "DATABASE_WRITE_FAILURE", message: err?.message });
  }
}

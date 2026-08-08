// pages/api/linkedin/campaigns/[id]/cancel-rest.js
// Kill switch: cancel every non-terminal PublishingJob for a campaign.
import prisma from "../../../../../lib/prisma.js";
import { requireAuth } from "../../../../../lib/auth.js";
import { applyJobOverride } from "../../../../../lib/linkedinAgent/jobActions.js";

const TERMINAL_STATUSES = ["PUBLISHED", "CANCELLED", "SKIPPED"];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { id } = req.query;
  const reason = (req.body?.reason || "Campaign cancelled by operator").trim();
  const actor = session.sub || "admin";

  try {
    const jobs = await prisma.publishingJob.findMany({
      where: { campaignId: id, status: { notIn: TERMINAL_STATUSES } },
      select: { id: true },
    });

    const cancelled = [];
    for (const job of jobs) {
      const updated = await applyJobOverride(prisma, job.id, "cancel", reason, actor);
      cancelled.push(updated.id);
    }

    return res.status(200).json({ cancelledCount: cancelled.length, jobIds: cancelled });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

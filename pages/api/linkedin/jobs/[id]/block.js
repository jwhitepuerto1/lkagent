// pages/api/linkedin/jobs/[id]/block.js
import prisma from "../../../../../lib/prisma.js";
import { requireAuth } from "../../../../../lib/auth.js";
import { applyJobOverride, JobActionError } from "../../../../../lib/linkedinAgent/jobActions.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const updated = await applyJobOverride(prisma, req.query.id, "block", req.body?.reason, session.sub || "admin");
    return res.status(200).json(updated);
  } catch (err) {
    if (err instanceof JobActionError) return res.status(400).json({ error: "JOB_ACTION_FAILED", message: err.message });
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

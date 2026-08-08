// pages/api/linkedin/jobs/[id]/precheck.js
import prisma from "../../../../../lib/prisma.js";
import { requireAuth } from "../../../../../lib/auth.js";
import { runJobPrecheck, PreflightError } from "../../../../../lib/linkedinAgent/preflight.js";

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
    const result = await runJobPrecheck(prisma, id, actor);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof PreflightError) {
      return res.status(409).json({ error: "PRECHECK_FAILED", message: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

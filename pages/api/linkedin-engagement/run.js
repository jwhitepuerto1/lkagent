// pages/api/linkedin-engagement/run.js
//
// Triggers one ingestion run. Accepts either the normal staff session
// cookie (manual trigger from the browser) OR a shared secret header
// (x-ingest-secret) so the n8n cron workflow can call this without a
// cookie-based session.
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";
import { runIngestion } from "../../../lib/linkedinEngagement/ingest.js";

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
    const result = await runIngestion(prisma);
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

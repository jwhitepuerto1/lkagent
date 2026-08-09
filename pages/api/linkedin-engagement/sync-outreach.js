// pages/api/linkedin-engagement/sync-outreach.js
// Polls invite acceptance + DM reply status. Same auth pattern as run.js
// (session cookie OR shared secret, so n8n can trigger it too).
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";
import { syncInvites, syncConversations } from "../../../lib/linkedinEngagement/outreachSync.js";

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
    const [invites, conversations] = await Promise.all([
      syncInvites(prisma),
      syncConversations(prisma),
    ]);
    return res.status(200).json({ invites, conversations });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

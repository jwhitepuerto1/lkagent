// pages/api/linkedin-engagement/connections.js
// POST -> all of the connected account's own 1st-degree connections,
// normalized. Manual-click only, never scheduled: Unipile flags the
// underlying relations endpoint for careful use (see listAllRelations in
// unipileClient.js). Nothing is written to the database; results live in the
// browser until exported via search-export.js.
import { requireAuth } from "../../../lib/auth.js";
import { listAllRelations } from "../../../lib/linkedinEngagement/unipileClient.js";
import { normalizeRelation } from "../../../lib/linkedinEngagement/normalize.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { items: raw, pages, truncated } = await listAllRelations();
    const items = raw.map(normalizeRelation).filter(Boolean);
    return res.status(200).json({ items, pages, truncated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

// pages/api/linkedin-engagement/search.js
// POST { keywords } -> normalized LinkedIn people-search results (1st-degree
// only). One-off tool, not part of the daily pipeline and not written to the
// database - results live only in the browser session until exported to CSV
// (see search-export.js). See unipileClient.js searchPeople and
// normalize.js normalizeSearchResult for the confirmed field mapping.
import { requireAuth } from "../../../lib/auth.js";
import { searchPeople } from "../../../lib/linkedinEngagement/unipileClient.js";
import { normalizeSearchResult } from "../../../lib/linkedinEngagement/normalize.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const keywords = String(req.body?.keywords || "").trim();
    if (!keywords) return res.status(400).json({ error: "keywords is required" });

    const limit = Number(req.body?.limit) || 20;
    const rawItems = await searchPeople({ keywords, limit });
    const items = rawItems.map(normalizeSearchResult).filter(Boolean);
    return res.status(200).json({ items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

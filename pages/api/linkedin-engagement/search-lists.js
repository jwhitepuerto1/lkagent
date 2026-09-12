// pages/api/linkedin-engagement/search-lists.js
// POST { name } -> matching saved Sales Navigator lead lists (id + title).
// Lookup step for exporting an existing list via search.js's leadListId,
// rather than running a fresh keyword search. See findLeadLists() in
// unipileClient.js.
import { requireAuth } from "../../../lib/auth.js";
import { findLeadLists } from "../../../lib/linkedinEngagement/unipileClient.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const name = String(req.body?.name || "").trim();
    const items = await findLeadLists({ keywords: name || undefined, limit: 20 });
    const lists = items.map((item) => ({ id: item.id, title: item.title }));
    return res.status(200).json({ lists });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

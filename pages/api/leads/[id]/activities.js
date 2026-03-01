// pages/api/leads/[id]/activities.js
import { getActivitiesByLeadId, addActivityForLead } from "../data/activityData";

export default function handler(req, res) {
  const { id: leadId } = req.query;

  if (!leadId) return res.status(400).json({ error: "Missing lead id" });

  if (req.method === "GET") {
    return res.status(200).json({ activities: getActivitiesByLeadId(leadId) });
  }

  if (req.method === "POST") {
    const { type, summary, by } = req.body || {};

    const allowed = new Set(["note", "call", "email", "meeting", "task"]);
    if (!type || !allowed.has(type)) {
      return res.status(400).json({ error: "Invalid activity type" });
    }

    if (!summary || String(summary).trim().length < 3) {
      return res.status(400).json({ error: "Summary must be at least 3 characters" });
    }

    const created = addActivityForLead(leadId, {
      type,
      summary: String(summary).trim(),
      by: by ? String(by).trim() : "System",
    });

    return res.status(201).json({ activity: created });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

// pages/api/activities.js
import prisma from "../../lib/prisma.js";
import { requireAuth } from "../../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // 🔒 Auth gate
  const session = requireAuth(req, res);
  if (!session) return;

  try {
    if (req.method === "GET") {
      const leadId = String(req.query.leadId || "").trim();
      if (!leadId) return res.status(400).json({ error: "leadId is required" });

      const activities = await prisma.activity.findMany({
        where: { leadId },
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      });

      return res.status(200).json(activities);
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const leadId = String(body.leadId || "").trim();
      const type = String(body.type || "").trim();
      const note = body.note == null ? null : String(body.note);
      const occurredAtRaw = body.occurredAt;

      if (!leadId) return res.status(400).json({ error: "leadId is required" });
      if (!type) return res.status(400).json({ error: "type is required" });

      const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
      if (!lead) return res.status(404).json({ error: "Lead not found" });

      const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : new Date();
      if (isNaN(occurredAt.getTime())) {
        return res.status(400).json({ error: "occurredAt must be a valid date" });
      }

      const created = await prisma.activity.create({
        data: { leadId, type, note, occurredAt },
      });

      return res.status(201).json(created);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

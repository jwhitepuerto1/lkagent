// pages/api/leads/[id].js
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";

function toDateOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // 🔒 Auth gate
  const session = requireAuth(req, res);
  if (!session) return;

  const id = String(req.query.id || "").trim();
  if (!id) return res.status(400).json({ error: "id is required" });

  try {
    if (req.method === "GET") {
      const lead = await prisma.lead.findUnique({ where: { id } });
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      return res.status(200).json(lead);
    }

    if (req.method === "PATCH") {
      const body = req.body || {};

      // Complete task action
      if (String(body.action || "") === "complete_task") {
        const now = new Date();
        const snoozeDaysRaw = body.snoozeDays;
        const snoozeDays = Number.isFinite(Number(snoozeDaysRaw)) ? Number(snoozeDaysRaw) : 0;

        const nextActionAt =
          snoozeDays && snoozeDays > 0
            ? new Date(now.getTime() + snoozeDays * 24 * 60 * 60 * 1000)
            : null;

        const note =
          body.note && String(body.note).trim()
            ? String(body.note).trim()
            : snoozeDays > 0
              ? `Completed task (snoozed ${snoozeDays}d)`
              : "Completed task";

        const existing = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
        if (!existing) return res.status(404).json({ error: "Lead not found" });

        const [, updatedLead] = await prisma.$transaction([
          prisma.activity.create({
            data: { leadId: id, type: "Task", note, occurredAt: now },
          }),
          prisma.lead.update({
            where: { id },
            data: { lastTouch: now, nextActionAt },
          }),
        ]);

        return res.status(200).json(updatedLead);
      }

      // Normal lead update
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          name: body.name ?? undefined,
          segment: body.segment ?? undefined,
          stage: body.stage ?? undefined,
          status: body.status ?? undefined,
          owner: body.owner ?? undefined,
          priority: body.priority ?? undefined,
          nextActionAt: body.nextActionAt === undefined ? undefined : toDateOrNull(body.nextActionAt),
          lastTouch: body.lastTouch === undefined ? undefined : toDateOrNull(body.lastTouch),
        },
      });

      return res.status(200).json(updated);
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

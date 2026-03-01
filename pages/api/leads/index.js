// pages/api/leads/index.js
import crypto from "crypto";
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";

function makeLeadId() {
  return `L-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // 🔒 Auth gate
  const session = requireAuth(req, res);
  if (!session) return;

  try {
    if (req.method === "GET") {
      const leads = await prisma.lead.findMany({
        orderBy: { id: "asc" },
      });
      return res.status(200).json(leads);
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const name = (body.name || "").trim();
      if (!name) return res.status(400).json({ error: "name is required" });

      const id = (body.id || "").trim() || makeLeadId();

      const lead = await prisma.lead.create({
        data: {
          id,
          name,
          segment: (body.segment || "Developer").trim(),
          stage: body.stage || "Prospect",
          status: body.status || "Active",
          owner: (body.owner || "John").trim(),
          priority: body.priority || "Medium",
          nextActionAt: body.nextActionAt ? new Date(body.nextActionAt) : null,
          lastTouch: body.lastTouch ? new Date(body.lastTouch) : null,
        },
      });

      return res.status(201).json(lead);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

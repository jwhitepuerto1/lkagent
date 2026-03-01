// pages/api/leads/new.js
import prisma from "../../../lib/prisma.js";

/**
 * Coerce a value into Date|null.
 * Accepts: ISO string, epoch ms number, Date, null/undefined/"".
 */
function toDateOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function makeLeadId() {
  // L- + 6 uppercase chars from uuid
  const s = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`)
    .toString()
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  return `L-${s.slice(0, 6)}`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      id,
      name,
      segment = "Developer",
      stage = "Prospect",
      status = "Active",
      owner = "John",
      priority = "Medium",
      nextActionAt,
      lastTouch,
    } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Missing required field: name" });
    }

    const lead = await prisma.lead.create({
      data: {
        id: (id && typeof id === "string" && id.trim()) ? id.trim() : makeLeadId(),
        name: name.trim(),
        segment,
        stage,
        status,
        owner,
        priority,
        nextActionAt: toDateOrNull(nextActionAt),
        lastTouch: toDateOrNull(lastTouch),
      },
    });

    return res.status(201).json(lead);
  } catch (err) {
    console.error("POST /api/leads/new failed:", err);

    // Prisma known errors sometimes have `code`
    const code = err?.code;
    const message = err?.message || "Internal Server Error";

    return res.status(500).json({ error: "Internal Server Error", code, message });
  }
}

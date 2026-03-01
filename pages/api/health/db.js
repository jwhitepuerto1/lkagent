// pages/api/health/db.js
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // 🔒 Auth gate (same as leads)
  const session = requireAuth(req, res);
  if (!session) return;

  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    // Minimal DB check (forces a real query)
    const rows = await prisma.$queryRaw`SELECT now() AS now`;
    const now = Array.isArray(rows) ? rows?.[0]?.now : null;

    return res.status(200).json({ ok: true, db: true, now });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      db: false,
      error: "DB health check failed",
      message: err?.message,
    });
  }
}
// pages/api/linkedin-engagement/profiles-search.js
// GET ?status=A,B,C -> list profiles matching any of the given statuses,
// ordered by priority. Used by the promotion candidate list and future
// filter/search UI (spec 11.3).
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { status, category } = req.query;
    const where = { suppressed: false };
    if (status) where.status = { in: String(status).split(",") };
    if (category) where.primaryCategory = { in: String(category).split(",") };

    const profiles = await prisma.engagementProfile.findMany({
      where,
      orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
      take: 200,
    });
    return res.status(200).json(profiles);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

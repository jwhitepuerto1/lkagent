// pages/api/linkedin/jobs/index.js
import prisma from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { status, destinationType, campaignId, dueOnly, from, to } = req.query;
    const where = {};

    if (status) {
      const statuses = String(status).split(",").filter(Boolean);
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }
    if (destinationType) where.destinationType = destinationType;
    if (campaignId) where.campaignId = campaignId;
    if (from || to) {
      where.publishDate = {};
      if (from) where.publishDate.gte = new Date(from);
      if (to) where.publishDate.lte = new Date(to);
    }
    if (dueOnly === "true") {
      where.earliestPublishAt = { lte: new Date() };
    }

    const jobs = await prisma.publishingJob.findMany({
      where,
      orderBy: [{ publishDate: "asc" }, { sequence: "asc" }],
      include: {
        campaign: { select: { id: true, campaignName: true } },
        destination: true,
        publishedPost: true,
      },
    });

    return res.status(200).json(jobs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

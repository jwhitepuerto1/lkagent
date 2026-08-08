// pages/api/linkedin/jobs/[id].js
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

  const { id } = req.query;

  try {
    const job = await prisma.publishingJob.findUnique({
      where: { id },
      include: {
        campaign: { select: { id: true, campaignName: true, status: true } },
        theme: true,
        generatedPost: true,
        destination: true,
        attempts: { orderBy: { createdAt: "desc" } },
        publishedPost: true,
      },
    });
    if (!job) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(job);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

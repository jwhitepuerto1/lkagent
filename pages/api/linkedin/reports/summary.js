// pages/api/linkedin/reports/summary.js
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
    const [byCampaignStatus, byDestinationStatus, campaigns, destinations] = await Promise.all([
      prisma.publishingJob.groupBy({ by: ["campaignId", "status"], _count: true }),
      prisma.publishingJob.groupBy({ by: ["destinationId", "status"], _count: true }),
      prisma.contentCampaign.findMany({ select: { id: true, campaignName: true } }),
      prisma.linkedinDestination.findMany({ select: { id: true, name: true, destinationType: true } }),
    ]);

    const campaignNames = Object.fromEntries(campaigns.map((c) => [c.id, c.campaignName]));
    const destinationInfo = Object.fromEntries(destinations.map((d) => [d.id, { name: d.name, type: d.destinationType }]));

    const byCampaign = {};
    for (const row of byCampaignStatus) {
      byCampaign[row.campaignId] ??= { campaignName: campaignNames[row.campaignId] || "(deleted)", counts: {} };
      byCampaign[row.campaignId].counts[row.status] = row._count;
    }

    const byDestination = {};
    for (const row of byDestinationStatus) {
      const info = destinationInfo[row.destinationId] || { name: "(deleted)", type: "" };
      byDestination[row.destinationId] ??= { destinationName: info.name, destinationType: info.type, counts: {} };
      byDestination[row.destinationId].counts[row.status] = row._count;
    }

    const totalByStatus = {};
    for (const row of byCampaignStatus) {
      totalByStatus[row.status] = (totalByStatus[row.status] || 0) + row._count;
    }

    return res.status(200).json({ totalByStatus, byCampaign, byDestination });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

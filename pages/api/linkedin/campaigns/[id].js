// pages/api/linkedin/campaigns/[id].js
import prisma from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/auth.js";

const EDITABLE_FIELDS = [
  "campaignName",
  "styleTone",
  "stylePostLength",
  "styleCtaStrength",
  "styleUseHashtags",
  "styleMaxHashtags",
  "styleIncludeQuestion",
  "styleGroupPersonalizationLevel",
  "suspended",
];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  const { id } = req.query;

  try {
    if (req.method === "GET") {
      const campaign = await prisma.contentCampaign.findUnique({
        where: { id },
        include: {
          personalDestination: true,
          companyDestination: true,
          groupDestinations: { include: { destination: true } },
          themes: {
            orderBy: { dayIndex: "asc" },
            include: {
              topic: true,
              asset: true,
              generatedPosts: {
                include: { destination: true, validationResults: true },
              },
            },
          },
          publishingJobs: true,
        },
      });
      if (!campaign) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(campaign);
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      const data = {};
      for (const field of EDITABLE_FIELDS) {
        if (body[field] !== undefined) data[field] = body[field];
      }
      const campaign = await prisma.contentCampaign.update({ where: { id }, data });
      return res.status(200).json(campaign);
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

// pages/api/linkedin/assets/index.js
import prisma from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  try {
    if (req.method === "GET") {
      const assets = await prisma.educationalAsset.findMany({ orderBy: { createdAt: "asc" } });
      return res.status(200).json(assets);
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const assetName = (body.assetName || "").trim();
      const canonicalUrl = (body.canonicalUrl || "").trim();
      const sourceCopy = (body.sourceCopy || "").trim();

      if (!assetName) return res.status(400).json({ error: "assetName is required" });
      if (!canonicalUrl) return res.status(400).json({ error: "canonicalUrl is required" });
      if (!sourceCopy) return res.status(400).json({ error: "sourceCopy is required" });

      const asset = await prisma.educationalAsset.create({
        data: {
          assetName,
          assetType: body.assetType || "other",
          canonicalUrl,
          sourceCopy,
          shortSummary: body.shortSummary || "",
          learningOutcomes: body.learningOutcomes || [],
          targetAudiences: body.targetAudiences || [],
          primaryProblem: body.primaryProblem || "",
          approvedCta: body.approvedCta || "",
          gatingType: body.gatingType || "none",
          active: body.active ?? true,
        },
      });
      return res.status(201).json(asset);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

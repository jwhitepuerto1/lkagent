// pages/api/linkedin/assets/[id].js
import prisma from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/auth.js";

const EDITABLE_FIELDS = [
  "assetName",
  "assetType",
  "canonicalUrl",
  "sourceCopy",
  "shortSummary",
  "learningOutcomes",
  "targetAudiences",
  "primaryProblem",
  "approvedCta",
  "gatingType",
  "urlStatus",
  "active",
];

const CONTENT_FIELDS = ["canonicalUrl", "sourceCopy", "shortSummary", "learningOutcomes", "approvedCta"];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  const { id } = req.query;

  try {
    if (req.method === "GET") {
      const asset = await prisma.educationalAsset.findUnique({ where: { id } });
      if (!asset) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(asset);
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      const existing = await prisma.educationalAsset.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: "Not found" });

      const data = {};
      for (const field of EDITABLE_FIELDS) {
        if (body[field] !== undefined) data[field] = body[field];
      }
      if (CONTENT_FIELDS.some((f) => body[f] !== undefined)) {
        data.version = existing.version + 1;
      }

      const asset = await prisma.educationalAsset.update({ where: { id }, data });
      return res.status(200).json(asset);
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

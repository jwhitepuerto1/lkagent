// pages/api/linkedin/destinations/[id].js
import prisma from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/auth.js";

const EDITABLE_FIELDS = [
  "name",
  "linkedinReference",
  "status",
  "audienceDescription",
  "rulesSummary",
  "promotionalLinksAllowed",
  "requiresModeratorReview",
  "preferredDaysTimes",
  "postingFrequencyCeiling",
  "urlPlacementPolicy",
  "templateNotes",
  "publishingMode",
];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  const { id } = req.query;

  try {
    if (req.method === "GET") {
      const destination = await prisma.linkedinDestination.findUnique({ where: { id } });
      if (!destination) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(destination);
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      const data = {};
      for (const field of EDITABLE_FIELDS) {
        if (body[field] !== undefined) data[field] = body[field];
      }
      if (data.status && !["ACTIVE", "PAUSED", "BLOCKED", "LEFT"].includes(data.status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      const destination = await prisma.linkedinDestination.update({ where: { id }, data });
      return res.status(200).json(destination);
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

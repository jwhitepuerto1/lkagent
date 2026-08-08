// pages/api/linkedin/destinations/index.js
import prisma from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  try {
    if (req.method === "GET") {
      const { type, status } = req.query;
      const where = {};
      if (type) where.destinationType = type;
      if (status) where.status = status;

      const destinations = await prisma.linkedinDestination.findMany({
        where,
        orderBy: [{ destinationType: "asc" }, { name: "asc" }],
      });
      return res.status(200).json(destinations);
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const name = (body.name || "").trim();
      const destinationType = body.destinationType;

      if (!name) return res.status(400).json({ error: "name is required" });
      if (!["PERSONAL", "COMPANY", "GROUP"].includes(destinationType)) {
        return res.status(400).json({ error: "destinationType must be PERSONAL, COMPANY, or GROUP" });
      }

      const destination = await prisma.linkedinDestination.create({
        data: {
          name,
          destinationType,
          linkedinReference: body.linkedinReference || null,
          audienceDescription: body.audienceDescription || null,
          rulesSummary: body.rulesSummary || null,
          promotionalLinksAllowed: body.promotionalLinksAllowed ?? true,
          requiresModeratorReview: body.requiresModeratorReview ?? false,
          preferredDaysTimes: body.preferredDaysTimes || null,
          postingFrequencyCeiling: body.postingFrequencyCeiling ?? null,
          urlPlacementPolicy: body.urlPlacementPolicy || "end",
          templateNotes: body.templateNotes || null,
        },
      });
      return res.status(201).json(destination);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

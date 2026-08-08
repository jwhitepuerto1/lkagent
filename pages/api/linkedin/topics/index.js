// pages/api/linkedin/topics/index.js
import prisma from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/auth.js";
import { REQUIRED_TOPIC_SLOTS } from "../../../../lib/linkedinAgent/constants.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  try {
    if (req.method === "GET") {
      const topics = await prisma.insightTopic.findMany({ orderBy: { createdAt: "asc" } });
      return res.status(200).json(topics);
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const name = (body.name || "").trim();
      if (!name) return res.status(400).json({ error: "name is required" });

      const active = body.active ?? true;
      if (active) {
        const activeCount = await prisma.insightTopic.count({ where: { active: true } });
        if (activeCount >= REQUIRED_TOPIC_SLOTS) {
          return res.status(400).json({
            error: `Cannot activate more than ${REQUIRED_TOPIC_SLOTS} topics at once. Deactivate one first.`,
          });
        }
      }

      const topic = await prisma.insightTopic.create({
        data: {
          name,
          description: body.description || "",
          approvedAngles: body.approvedAngles || [],
          prohibitedAngles: body.prohibitedAngles || [],
          targetAudiences: body.targetAudiences || [],
          supportingFacts: body.supportingFacts || [],
          preferredCtaType: body.preferredCtaType || null,
          active,
        },
      });
      return res.status(201).json(topic);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

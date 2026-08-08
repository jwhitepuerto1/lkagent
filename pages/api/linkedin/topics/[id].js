// pages/api/linkedin/topics/[id].js
import prisma from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/auth.js";
import { REQUIRED_TOPIC_SLOTS } from "../../../../lib/linkedinAgent/constants.js";

const EDITABLE_FIELDS = [
  "name",
  "description",
  "approvedAngles",
  "prohibitedAngles",
  "targetAudiences",
  "supportingFacts",
  "preferredCtaType",
  "active",
];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  const { id } = req.query;

  try {
    if (req.method === "GET") {
      const topic = await prisma.insightTopic.findUnique({ where: { id } });
      if (!topic) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(topic);
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      const existing = await prisma.insightTopic.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: "Not found" });

      if (body.active === true && !existing.active) {
        const activeCount = await prisma.insightTopic.count({ where: { active: true } });
        if (activeCount >= REQUIRED_TOPIC_SLOTS) {
          return res.status(400).json({
            error: `Cannot activate more than ${REQUIRED_TOPIC_SLOTS} topics at once. Deactivate one first.`,
          });
        }
      }

      const data = {};
      for (const field of EDITABLE_FIELDS) {
        if (body[field] !== undefined) data[field] = body[field];
      }
      // Any content edit bumps the version, per spec's versioned-source rule
      // (generated posts snapshot the version they were built from).
      const contentFieldsChanged = [
        "description",
        "approvedAngles",
        "prohibitedAngles",
        "targetAudiences",
        "supportingFacts",
      ].some((f) => body[f] !== undefined);
      if (contentFieldsChanged) data.version = existing.version + 1;

      const topic = await prisma.insightTopic.update({ where: { id }, data });
      return res.status(200).json(topic);
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

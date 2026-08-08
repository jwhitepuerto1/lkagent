// pages/api/linkedin/controls/index.js
import prisma from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/auth.js";
import { getOrCreatePlatformConfig, getOrCreatePublishingControl } from "../../../../lib/linkedinAgent/config.js";

const CONTROL_FIELDS = ["pauseAll", "pausePersonal", "pauseCompany", "pauseAllGroups"];
const CONFIG_FIELDS = ["linkedinCharLimit", "similarityThreshold", "duplicateLookbackDays", "reuseCooldownDays"];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  const actor = session.sub || "admin";

  try {
    if (req.method === "GET") {
      const [control, config] = await Promise.all([
        getOrCreatePublishingControl(prisma),
        getOrCreatePlatformConfig(prisma),
      ]);
      return res.status(200).json({ control, config });
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      await getOrCreatePublishingControl(prisma);
      await getOrCreatePlatformConfig(prisma);

      const controlData = {};
      for (const field of CONTROL_FIELDS) {
        if (body[field] !== undefined) controlData[field] = Boolean(body[field]);
      }
      const configData = {};
      for (const field of CONFIG_FIELDS) {
        if (body[field] !== undefined) configData[field] = Number(body[field]);
      }

      if (Object.keys(controlData).length > 0) controlData.updatedBy = actor;
      if (Object.keys(configData).length > 0) configData.updatedBy = actor;

      const [control, config] = await Promise.all([
        Object.keys(controlData).length > 0
          ? prisma.publishingControl.update({ where: { id: "global" }, data: controlData })
          : prisma.publishingControl.findUnique({ where: { id: "global" } }),
        Object.keys(configData).length > 0
          ? prisma.platformConfig.update({ where: { id: "global" }, data: configData })
          : prisma.platformConfig.findUnique({ where: { id: "global" } }),
      ]);

      return res.status(200).json({ control, config });
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

// pages/api/linkedin/themes/[id].js
import prisma from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  const { id } = req.query;

  try {
    if (req.method === "GET") {
      const theme = await prisma.campaignTheme.findUnique({
        where: { id },
        include: {
          topic: true,
          asset: true,
          generatedPosts: { include: { destination: true, validationResults: true } },
        },
      });
      if (!theme) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(theme);
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      const data = {};
      if (body.suspended !== undefined) data.suspended = Boolean(body.suspended);
      const theme = await prisma.campaignTheme.update({ where: { id }, data });
      return res.status(200).json(theme);
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

// pages/api/linkedin-engagement/export.js
// GET -> list promoted-but-unexported profiles (for the UI to show counts).
// POST -> generate the CSV, record a PromotionExport batch, and return the
// file for John to download and submit into ias_cre_agent himself.
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";
import { buildPeopleCsv } from "../../../lib/linkedinEngagement/csvExport.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  try {
    if (req.method === "GET") {
      const pending = await prisma.engagementProfile.findMany({
        where: { status: "PROMOTED", promotionExportId: null },
        orderBy: { promotedAt: "desc" },
      });
      const history = await prisma.promotionExport.findMany({
        orderBy: { exportedAt: "desc" },
        include: { _count: { select: { profiles: true } } },
      });
      return res.status(200).json({ pending, history });
    }

    if (req.method === "POST") {
      const profiles = await prisma.engagementProfile.findMany({
        where: { status: "PROMOTED", promotionExportId: null },
      });
      if (profiles.length === 0) {
        return res.status(400).json({ error: "No promoted, unexported profiles to include." });
      }

      const csv = buildPeopleCsv(profiles);
      const fileName = `linkedin-promoted-${new Date().toISOString().slice(0, 10)}.csv`;
      const actor = session.sub || "admin";

      const batch = await prisma.$transaction(async (tx) => {
        const created = await tx.promotionExport.create({
          data: { fileName, recordCount: profiles.length, exportedBy: actor },
        });
        await tx.engagementProfile.updateMany({
          where: { id: { in: profiles.map((p) => p.id) } },
          data: { promotionExportId: created.id },
        });
        return created;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("X-Export-Batch-Id", batch.id);
      return res.status(200).send(csv);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

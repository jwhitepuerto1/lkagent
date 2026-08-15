// pages/api/linkedin-engagement/export-quick.js
// POST { profileIds: string[] } -> CSV of the selected profiles, in the
// same ias_cre_agent column format as /api/linkedin-engagement/export.js
// (see lib/linkedinEngagement/csvExport.js). Unlike that endpoint, this one
// is stateless: it does not require status=PROMOTED, does not write a
// PromotionExport batch, and does not mark profiles as exported. It exists
// for a fast one-off CSV of anything retrieved, without going through the
// promotion-review workflow on /linkedin-engagement/promote.
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";
import { buildPeopleCsv } from "../../../lib/linkedinEngagement/csvExport.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const profileIds = Array.isArray(req.body?.profileIds) ? req.body.profileIds : [];
    if (profileIds.length === 0) {
      return res.status(400).json({ error: "profileIds is required and must be non-empty." });
    }

    const profiles = await prisma.engagementProfile.findMany({
      where: { id: { in: profileIds } },
    });
    if (profiles.length === 0) {
      return res.status(400).json({ error: "No matching profiles found." });
    }

    const csv = buildPeopleCsv(profiles);
    const fileName = `linkedin-quick-export-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

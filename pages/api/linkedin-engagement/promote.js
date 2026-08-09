// pages/api/linkedin-engagement/promote.js
// "Promote to CRE Prospect" (spec 8.1/8.2, trimmed): flags the record and
// preserves why. Does not call any external system - John submits the CSV
// this produces into ias_cre_agent himself.
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { profileIds, reason } = req.body || {};
  if (!Array.isArray(profileIds) || profileIds.length === 0) {
    return res.status(400).json({ error: "profileIds (non-empty array) is required" });
  }
  if (!reason) {
    return res.status(400).json({ error: "reason is required" });
  }

  const actor = session.sub || "admin";

  try {
    const existing = await prisma.engagementProfile.findMany({
      where: { id: { in: profileIds } },
      select: { id: true, suppressed: true, fullName: true },
    });
    const suppressedIds = existing.filter((p) => p.suppressed).map((p) => p.id);
    // ias_cre_agent's importer flags MISSING_NAME as invalid - promoting a
    // nameless stub would just produce a blank row it rejects. Catch it here
    // instead, so John finds out at promotion time, not after a failed import.
    const namelessIds = existing.filter((p) => !p.suppressed && !p.fullName).map((p) => p.id);
    const eligibleIds = existing
      .filter((p) => !p.suppressed && p.fullName)
      .map((p) => p.id);

    if (eligibleIds.length > 0) {
      await prisma.engagementProfile.updateMany({
        where: { id: { in: eligibleIds } },
        data: {
          status: "PROMOTED",
          promotedAt: new Date(),
          promotedBy: actor,
          promotionReason: reason,
        },
      });
    }

    return res.status(200).json({
      promotedCount: eligibleIds.length,
      skippedSuppressed: suppressedIds,
      skippedNoName: namelessIds,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

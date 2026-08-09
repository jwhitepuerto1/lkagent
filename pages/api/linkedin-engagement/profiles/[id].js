// pages/api/linkedin-engagement/profiles/[id].js
import prisma from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/auth.js";

const EDITABLE_FIELDS = [
  "primaryCategory",
  "secondaryCategories",
  "status",
  "suppressed",
  "suppressedReason",
  "nextActionDue",
  "nextActionReason",
];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  const { id } = req.query;

  try {
    if (req.method === "GET") {
      const profile = await prisma.engagementProfile.findUnique({
        where: { id },
        include: {
          engagements: { include: { post: true }, orderBy: { reactedAt: "desc" } },
          invites: true,
          conversations: true,
          commentReplies: { include: { outreachComment: true } },
        },
      });
      if (!profile) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(profile);
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      const data = {};
      for (const field of EDITABLE_FIELDS) {
        if (body[field] !== undefined) data[field] = body[field];
      }
      // A manual category change is an override the classifier must respect
      // going forward (spec 7.4: "override must be retained as the
      // authoritative value unless deliberately reset").
      if (body.primaryCategory !== undefined) data.classificationOverridden = true;
      if (body.resetOverride === true) data.classificationOverridden = false;

      const profile = await prisma.engagementProfile.update({ where: { id }, data });
      return res.status(200).json(profile);
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

// pages/api/linkedin/posts/[id]/request-changes.js
import prisma from "../../../../../lib/prisma.js";
import { requireAuth } from "../../../../../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { id } = req.query;
  const notes = (req.body?.notes || "").trim();
  const actor = session.sub || "admin";

  try {
    const post = await prisma.generatedPost.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ error: "Not found" });

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.generatedPost.update({ where: { id }, data: { approvalStatus: "CHANGES_REQUESTED" } });
      await tx.contentApproval.create({
        data: {
          campaignId: post.campaignId,
          themeId: post.themeId,
          generatedPostId: post.id,
          level: "PLACEMENT",
          action: "REQUEST_CHANGES",
          approver: actor,
          copyVersion: post.copyVersion,
          notes: notes || null,
        },
      });
      return u;
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

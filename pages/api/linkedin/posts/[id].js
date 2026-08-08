// pages/api/linkedin/posts/[id].js
import prisma from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/auth.js";
import { computeContentHash } from "../../../../lib/linkedinAgent/contentHash.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  const { id } = req.query;

  try {
    if (req.method === "GET") {
      const post = await prisma.generatedPost.findUnique({
        where: { id },
        include: { destination: true, theme: true, versions: { orderBy: { copyVersion: "desc" } }, validationResults: true },
      });
      if (!post) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(post);
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      const existing = await prisma.generatedPost.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: "Not found" });

      const data = {};
      let textChanged = false;

      if (body.postText !== undefined && body.postText !== existing.postText) {
        textChanged = true;
        data.postText = body.postText;
        data.contentHash = computeContentHash(body.postText);
        data.copyVersion = existing.copyVersion + 1;
        data.approvalStatus = "DRAFT";
        data.validationStatus = "PENDING";
        data.approvedBy = null;
        data.approvedAt = null;
      }
      if (body.urlIncluded !== undefined) data.urlIncluded = body.urlIncluded;
      if (body.hashtags !== undefined) data.hashtags = body.hashtags;

      const post = await prisma.$transaction(async (tx) => {
        const updated = await tx.generatedPost.update({ where: { id }, data });
        if (textChanged) {
          await tx.generatedPostVersion.create({
            data: {
              generatedPostId: id,
              copyVersion: updated.copyVersion,
              postText: updated.postText,
              contentHash: updated.contentHash,
              changeReason: "manual_edit",
              changedBy: session.sub || "admin",
            },
          });
        }
        return updated;
      });

      return res.status(200).json(post);
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}

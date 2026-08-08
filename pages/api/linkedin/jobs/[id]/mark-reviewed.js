// pages/api/linkedin/jobs/[id]/mark-reviewed.js
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
  const approved = Boolean(req.body?.approved);
  const actor = session.sub || "admin";

  try {
    const job = await prisma.publishingJob.findUnique({ where: { id }, include: { publishedPost: true } });
    if (!job) return res.status(404).json({ error: "Not found" });
    if (job.status !== "PENDING_GROUP_REVIEW") {
      return res.status(409).json({ error: "PRECHECK_FAILED", message: `Job status is ${job.status}, expected PENDING_GROUP_REVIEW.` });
    }

    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      if (job.publishedPost) {
        await tx.publishedPost.update({
          where: { id: job.publishedPost.id },
          data: { moderationStatus: approved ? "APPROVED" : "REJECTED" },
        });
      }

      const u = await tx.publishingJob.update({
        where: { id },
        data: {
          status: approved ? "PUBLISHED" : "BLOCKED",
          blockReason: approved ? null : "Group moderator rejected the post.",
        },
      });

      if (approved) {
        await tx.linkedinDestination.update({ where: { id: job.destinationId }, data: { lastSuccessfulPostAt: now } });
      }

      await tx.publicationAttempt.create({
        data: {
          publishingJobId: id,
          attemptNumber: (await tx.publicationAttempt.count({ where: { publishingJobId: id } })) + 1,
          action: "MARK_PENDING_REVIEW",
          result: approved ? "OK" : "FAILED",
          actor,
          details: { approved },
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

// pages/api/linkedin/jobs/[id]/confirm-publish.js
// Manual proof-of-publication capture (spec §7.8.8, adapted for Phase 1:
// no browser automation, the operator pastes the resulting LinkedIn post URL).
import prisma from "../../../../../lib/prisma.js";
import { requireAuth } from "../../../../../lib/auth.js";
import { runJobPrecheck, loadJobWithRelations, PreflightError } from "../../../../../lib/linkedinAgent/preflight.js";
import { isValidUrl } from "../../../../../lib/linkedinAgent/validation.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { id } = req.query;
  const actor = session.sub || "admin";
  const postUrl = (req.body?.postUrl || "").trim();

  if (!postUrl || !isValidUrl(postUrl)) {
    return res.status(400).json({ error: "URL_INVALID", message: "A valid proof-of-publication URL is required." });
  }

  try {
    const before = await loadJobWithRelations(prisma, id);
    if (!before) return res.status(404).json({ error: "Not found" });
    if (before.status !== "AWAITING_HUMAN") {
      return res.status(409).json({
        error: "PRECHECK_FAILED",
        message: `Job status is ${before.status}, expected AWAITING_HUMAN. Run precheck again.`,
      });
    }

    // Re-run precheck inline to defend against races (pause toggled, copy
    // edited, etc. between the operator opening the queue and confirming).
    const precheck = await runJobPrecheck(prisma, id, actor);
    if (!precheck.ok) {
      return res.status(409).json({ error: "PRECHECK_FAILED", message: precheck.blockReason });
    }

    const job = precheck.job;
    const requiresReview = before.destination.requiresModeratorReview;
    const newStatus = requiresReview ? "PENDING_GROUP_REVIEW" : "PUBLISHED";
    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      await tx.publishedPost.create({
        data: {
          publishingJobId: job.id,
          destinationId: job.destinationId,
          postUrl,
          recordedBy: actor,
        },
      });

      const u = await tx.publishingJob.update({
        where: { id: job.id },
        data: { status: newStatus, confirmedBy: actor, confirmedAt: now, publishedUrl: postUrl },
      });

      if (!requiresReview) {
        await tx.linkedinDestination.update({
          where: { id: job.destinationId },
          data: { lastSuccessfulPostAt: now },
        });
      }

      await tx.publicationAttempt.create({
        data: {
          publishingJobId: job.id,
          attemptNumber: (await tx.publicationAttempt.count({ where: { publishingJobId: job.id } })) + 1,
          action: "CONFIRM",
          result: "OK",
          actor,
          details: { postUrl, resultingStatus: newStatus },
        },
      });

      return u;
    });

    return res.status(200).json(updated);
  } catch (err) {
    if (err instanceof PreflightError) {
      return res.status(409).json({ error: "PRECHECK_FAILED", message: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: "DATABASE_WRITE_FAILURE", message: err?.message });
  }
}

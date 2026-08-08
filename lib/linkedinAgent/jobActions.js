// lib/linkedinAgent/jobActions.js
// Shared operator-override transitions: block/skip/cancel are reachable
// from any non-terminal job state (spec §7.11 kill switches).
const TERMINAL_STATUSES = new Set(["PUBLISHED", "CANCELLED", "SKIPPED"]);

export class JobActionError extends Error {
  constructor(message) {
    super(message);
    this.name = "JobActionError";
  }
}

const ACTION_CONFIG = {
  block: { status: "BLOCKED", reasonField: "blockReason", attemptAction: "BLOCK" },
  skip: { status: "SKIPPED", reasonField: "skipReason", attemptAction: "SKIP" },
  cancel: { status: "CANCELLED", reasonField: "cancelReason", attemptAction: "CANCEL" },
};

export async function applyJobOverride(prisma, jobId, actionKey, reason, actor) {
  const config = ACTION_CONFIG[actionKey];
  if (!config) throw new JobActionError(`Unknown job action: ${actionKey}`);
  if (!reason || !reason.trim()) throw new JobActionError("A reason is required.");

  const job = await prisma.publishingJob.findUnique({ where: { id: jobId } });
  if (!job) throw new JobActionError("Job not found.");
  if (TERMINAL_STATUSES.has(job.status)) {
    throw new JobActionError(`Job is already in a terminal state (${job.status}).`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.publishingJob.update({
      where: { id: jobId },
      data: { status: config.status, [config.reasonField]: reason.trim() },
    });
    await tx.publicationAttempt.create({
      data: {
        publishingJobId: jobId,
        attemptNumber: (await tx.publicationAttempt.count({ where: { publishingJobId: jobId } })) + 1,
        action: config.attemptAction,
        result: "OK",
        actor,
        details: { reason: reason.trim() },
      },
    });
    return updated;
  });
}

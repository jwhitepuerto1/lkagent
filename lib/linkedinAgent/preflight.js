// lib/linkedinAgent/preflight.js
// Spec section 7.6 preflight checks, run before a job is offered to the
// operator for confirmation, and re-run inline at confirm time against races.
import { checkHandoffEligibility } from "./handoff.js";
import { getOrCreatePublishingControl } from "./config.js";
import { isValidUrl } from "./validation.js";

// BLOCKED is included so an operator can retry a job once the underlying
// condition (a pause, a since-fixed URL, etc.) is resolved - the queue UI's
// "Run precheck" button is shown for both QUEUED and BLOCKED jobs.
const PRECHECKABLE_STATUSES = new Set(["QUEUED", "PRECHECK", "AWAITING_HUMAN", "BLOCKED"]);

export class PreflightError extends Error {
  constructor(message) {
    super(message);
    this.name = "PreflightError";
  }
}

function pauseReasonFor(job, control) {
  if (control.pauseAll) return "Global publishing is paused.";
  if (job.destinationType === "PERSONAL" && control.pausePersonal) return "Personal publishing is paused.";
  if (job.destinationType === "COMPANY" && control.pauseCompany) return "Company publishing is paused.";
  if (job.destinationType === "GROUP" && control.pauseAllGroups) return "Group publishing is paused.";
  return null;
}

export async function loadJobWithRelations(prisma, jobId) {
  return prisma.publishingJob.findUnique({
    where: { id: jobId },
    include: { campaign: true, theme: true, generatedPost: true, destination: true, publishedPost: true },
  });
}

export async function runJobPrecheck(prisma, jobId, actor = "admin") {
  const job = await loadJobWithRelations(prisma, jobId);
  if (!job) throw new PreflightError("Job not found.");
  if (!PRECHECKABLE_STATUSES.has(job.status)) {
    throw new PreflightError(`Job status ${job.status} is not eligible for precheck.`);
  }

  const warnings = [];
  let blockReason = null;

  const eligibility = checkHandoffEligibility(job);
  if (!eligibility.eligible) {
    blockReason = `Not eligible for handoff: ${eligibility.reasons.join("; ")}`;
  }

  if (!blockReason) {
    const control = await getOrCreatePublishingControl(prisma);
    blockReason = pauseReasonFor(job, control);
  }

  if (!blockReason && job.publishedPost) {
    blockReason = "A publication record already exists for this job (idempotency key already used).";
  }

  if (!blockReason && job.contentHash !== job.generatedPost.lockedContentHash) {
    blockReason = "Approved copy has changed since this job was locked; this must go back to the Generation Agent.";
  }

  if (!blockReason && job.canonicalUrl && !isValidUrl(job.canonicalUrl)) {
    blockReason = "Canonical URL is not syntactically valid.";
  }

  const now = new Date();
  if (!blockReason) {
    if (now < job.earliestPublishAt) warnings.push("Earlier than the scheduled publish window.");
    if (now > job.latestPublishAt) warnings.push("Later than the scheduled publish window.");
  }

  const nextAttemptNumber = (await prisma.publicationAttempt.count({ where: { publishingJobId: job.id } })) + 1;

  if (blockReason) {
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.publishingJob.update({
        where: { id: job.id },
        data: { status: "BLOCKED", blockReason },
      });
      await tx.publicationAttempt.create({
        data: {
          publishingJobId: job.id,
          attemptNumber: nextAttemptNumber,
          action: "PRECHECK",
          result: "FAILED",
          actor,
          details: { blockReason },
        },
      });
      return u;
    });
    return { ok: false, blockReason, warnings, job: updated };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.publishingJob.update({
      where: { id: job.id },
      data: { status: "AWAITING_HUMAN" },
    });
    await tx.publicationAttempt.create({
      data: {
        publishingJobId: job.id,
        attemptNumber: nextAttemptNumber,
        action: "PRECHECK",
        result: "OK",
        actor,
        details: { warnings },
      },
    });
    return u;
  });

  return { ok: true, blockReason: null, warnings, job: updated };
}

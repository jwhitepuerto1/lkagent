// pages/api/linkedin/posts/[id]/regenerate.js
import prisma from "../../../../../lib/prisma.js";
import { requireAuth } from "../../../../../lib/auth.js";
import { buildCopyPrompt } from "../../../../../lib/linkedinAgent/prompts.js";
import { callClaude, extractJson } from "../../../../../lib/linkedinAgent/anthropicClient.js";
import { computeContentHash } from "../../../../../lib/linkedinAgent/contentHash.js";
import { ANTHROPIC_MODEL } from "../../../../../lib/linkedinAgent/constants.js";

const PROMPT_VERSION = "copy-v1";

function firstSentence(text) {
  const match = String(text || "").match(/^[^.!?]*[.!?]/);
  return (match ? match[0] : String(text || "").slice(0, 120)).trim();
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { id } = req.query;

  try {
    const post = await prisma.generatedPost.findUnique({
      where: { id },
      include: {
        destination: true,
        theme: { include: { topic: true, asset: true } },
        campaign: true,
      },
    });
    if (!post) return res.status(404).json({ error: "Not found" });

    let priorOpeners = [];
    if (post.destination.destinationType === "GROUP") {
      const siblings = await prisma.generatedPost.findMany({
        where: { themeId: post.themeId, id: { not: post.id }, destination: { destinationType: "GROUP" } },
        select: { postText: true },
      });
      priorOpeners = siblings.map((s) => firstSentence(s.postText));
    }

    const { system, messages } = buildCopyPrompt({
      theme: post.theme,
      destination: post.destination,
      campaign: post.campaign,
      priorOpeners,
    });

    const response = await callClaude({ system, messages, maxTokens: 1200 });
    const parsed = extractJson(response.text);
    if (!parsed?.postText) {
      await prisma.postGenerationRun.create({
        data: {
          campaignId: post.campaignId,
          themeId: post.themeId,
          generatedPostId: post.id,
          runType: "COPY",
          model: ANTHROPIC_MODEL,
          promptVersion: PROMPT_VERSION,
          requestSummary: { regeneration: true },
          status: "FAILED",
          errorMessage: "Model response missing postText",
        },
      });
      return res.status(502).json({ error: "GENERATION_INCOMPLETE", message: "Regeneration failed: model response missing postText." });
    }

    const contentHash = computeContentHash(parsed.postText);

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.generatedPost.update({
        where: { id },
        data: {
          postText: parsed.postText,
          contentHash,
          urlIncluded: parsed.urlIncluded || null,
          hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
          copyVersion: post.copyVersion + 1,
          approvalStatus: "DRAFT",
          validationStatus: "PENDING",
          approvedBy: null,
          approvedAt: null,
        },
      });
      await tx.generatedPostVersion.create({
        data: {
          generatedPostId: id,
          copyVersion: u.copyVersion,
          postText: u.postText,
          contentHash: u.contentHash,
          changeReason: "regeneration_requested",
          changedBy: session.sub || "admin",
        },
      });
      await tx.postGenerationRun.create({
        data: {
          campaignId: post.campaignId,
          themeId: post.themeId,
          generatedPostId: post.id,
          runType: "COPY",
          model: ANTHROPIC_MODEL,
          promptVersion: PROMPT_VERSION,
          requestSummary: { regeneration: true },
          responseSummary: { length: parsed.postText.length },
          usageInputTokens: response.usage?.input_tokens ?? null,
          usageOutputTokens: response.usage?.output_tokens ?? null,
          latencyMs: response.latencyMs,
          status: "SUCCESS",
        },
      });
      return u;
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DATABASE_WRITE_FAILURE", message: err?.message });
  }
}

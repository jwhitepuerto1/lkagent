// pages/api/linkedin/campaigns/[id]/generate-copy.js
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
  const scopeThemeIds = Array.isArray(req.body?.themeIds) ? req.body.themeIds : null;

  try {
    const campaign = await prisma.contentCampaign.findUnique({
      where: { id },
      include: {
        personalDestination: true,
        companyDestination: true,
        groupDestinations: { include: { destination: true } },
        themes: {
          where: scopeThemeIds ? { id: { in: scopeThemeIds } } : undefined,
          include: { topic: true, asset: true, generatedPosts: true },
          orderBy: { dayIndex: "asc" },
        },
      },
    });
    if (!campaign) return res.status(404).json({ error: "Not found" });
    if (campaign.themes.length === 0) {
      return res.status(400).json({ error: "GENERATION_INCOMPLETE", message: "Generate the outline before generating copy." });
    }

    const results = { created: 0, skippedExisting: 0, failed: [] };

    for (const theme of campaign.themes) {
      const destinations = [
        campaign.personalDestination,
        campaign.companyDestination,
        ...campaign.groupDestinations.map((g) => g.destination),
      ];

      const existingByDestination = new Map(theme.generatedPosts.map((p) => [p.destinationId, p]));
      const priorOpeners = [];

      for (const destination of destinations) {
        if (existingByDestination.has(destination.id)) {
          results.skippedExisting++;
          if (destination.destinationType === "GROUP") {
            priorOpeners.push(firstSentence(existingByDestination.get(destination.id).postText));
          }
          continue;
        }

        const { system, messages } = buildCopyPrompt({
          theme,
          destination,
          campaign,
          priorOpeners: destination.destinationType === "GROUP" ? priorOpeners : [],
        });

        let runStatus = "SUCCESS";
        let errorMessage = null;
        let usage = null;
        let latencyMs = null;
        let parsed = null;

        try {
          const response = await callClaude({ system, messages, maxTokens: 1200 });
          usage = response.usage;
          latencyMs = response.latencyMs;
          parsed = extractJson(response.text);
          if (!parsed?.postText || typeof parsed.postText !== "string") {
            throw new Error("Model response missing postText");
          }
        } catch (genErr) {
          runStatus = "FAILED";
          errorMessage = genErr.message;
        }

        await prisma.postGenerationRun.create({
          data: {
            campaignId: campaign.id,
            themeId: theme.id,
            runType: "COPY",
            model: ANTHROPIC_MODEL,
            promptVersion: PROMPT_VERSION,
            requestSummary: { themeId: theme.id, destinationId: destination.id, destinationType: destination.destinationType },
            responseSummary: runStatus === "SUCCESS" ? { length: parsed.postText.length } : null,
            usageInputTokens: usage?.input_tokens ?? null,
            usageOutputTokens: usage?.output_tokens ?? null,
            latencyMs,
            status: runStatus,
            errorMessage,
          },
        });

        if (runStatus === "FAILED") {
          results.failed.push({ themeId: theme.id, destinationId: destination.id, error: errorMessage });
          continue;
        }

        const contentHash = computeContentHash(parsed.postText);

        let post;
        try {
          post = await prisma.$transaction(async (tx) => {
            const created = await tx.generatedPost.create({
              data: {
                campaignId: campaign.id,
                themeId: theme.id,
                destinationId: destination.id,
                postType: theme.postType,
                postText: parsed.postText,
                contentHash,
                copyVersion: 1,
                urlIncluded: parsed.urlIncluded || null,
                hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
                validationStatus: "PENDING",
                approvalStatus: "DRAFT",
              },
            });
            await tx.generatedPostVersion.create({
              data: {
                generatedPostId: created.id,
                copyVersion: 1,
                postText: parsed.postText,
                contentHash,
                changeReason: "initial_generation",
              },
            });
            return created;
          });
        } catch (writeErr) {
          // A concurrent generate-copy call (e.g. a double-submitted request)
          // may have already created this (theme, destination) placement.
          // The unique constraint caught it correctly - treat as skip rather
          // than failing the whole batch.
          if (writeErr?.code === "P2002") {
            const existing = await prisma.generatedPost.findUnique({
              where: { themeId_destinationId: { themeId: theme.id, destinationId: destination.id } },
            });
            results.skippedExisting++;
            if (destination.destinationType === "GROUP" && existing) {
              priorOpeners.push(firstSentence(existing.postText));
            }
            continue;
          }
          throw writeErr;
        }

        results.created++;
        if (destination.destinationType === "GROUP") {
          priorOpeners.push(firstSentence(post.postText));
        }
      }
    }

    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DATABASE_WRITE_FAILURE", message: err?.message });
  }
}

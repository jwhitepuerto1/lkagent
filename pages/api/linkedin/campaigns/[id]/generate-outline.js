// pages/api/linkedin/campaigns/[id]/generate-outline.js
import prisma from "../../../../../lib/prisma.js";
import { requireAuth } from "../../../../../lib/auth.js";
import { getOrCreatePlatformConfig } from "../../../../../lib/linkedinAgent/config.js";
import { selectTopics, selectAssets, buildDayTypeSequence } from "../../../../../lib/linkedinAgent/ranking.js";
import { buildOutlinePrompt } from "../../../../../lib/linkedinAgent/prompts.js";
import { callClaude, extractJson } from "../../../../../lib/linkedinAgent/anthropicClient.js";
import { ANTHROPIC_MODEL } from "../../../../../lib/linkedinAgent/constants.js";

const PROMPT_VERSION = "outline-v1";

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
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
    const campaign = await prisma.contentCampaign.findUnique({ where: { id } });
    if (!campaign) return res.status(404).json({ error: "Not found" });

    const existingPosts = await prisma.generatedPost.count({ where: { campaignId: id } });
    if (existingPosts > 0) {
      return res.status(409).json({
        error: "GENERATION_INCOMPLETE",
        message: "Copy has already been generated for this campaign's themes; outline can no longer be regenerated.",
      });
    }

    const platformConfig = await getOrCreatePlatformConfig(prisma);

    const daySequence = buildDayTypeSequence(campaign.insightPostCount, campaign.assetPostCount);
    const topicConfig = campaign.topicSelectionConfig || {};
    const assetConfig = campaign.assetSelectionConfig || {};

    let selectedTopics = [];
    if (campaign.insightPostCount > 0) {
      const allTopics = await prisma.insightTopic.findMany({ where: { active: true } });
      const topicResult = selectTopics({
        items: allTopics,
        count: campaign.insightPostCount,
        mode: campaign.topicSelectionMode,
        specifiedIds: topicConfig.specifiedTopicIds || [],
        requiredIds: topicConfig.requiredTopicIds || [],
        excludedIds: topicConfig.excludedTopicIds || [],
        cooldownDays: platformConfig.reuseCooldownDays,
      });
      if (topicResult.insufficient) {
        return res.status(400).json({ error: "INSUFFICIENT_TOPICS", message: "Not enough eligible topics to fill the campaign." });
      }
      selectedTopics = topicResult.selected;
    }

    let selectedAssets = [];
    if (campaign.assetPostCount > 0) {
      const allAssets = await prisma.educationalAsset.findMany({ where: { active: true } });
      const assetResult = selectAssets({
        items: allAssets,
        count: campaign.assetPostCount,
        mode: campaign.assetSelectionMode,
        specifiedIds: assetConfig.specifiedAssetIds || [],
        requiredIds: assetConfig.requiredAssetIds || [],
        excludedIds: assetConfig.excludedAssetIds || [],
        cooldownDays: platformConfig.reuseCooldownDays,
      });
      if (assetResult.insufficient) {
        return res.status(400).json({ error: "INSUFFICIENT_ASSETS", message: "Not enough eligible assets to fill the campaign." });
      }
      selectedAssets = assetResult.selected;
    }

    let topicCursor = 0;
    let assetCursor = 0;
    const daySlots = daySequence.map((postType, idx) => {
      if (postType === "INSIGHT") {
        const topic = selectedTopics[topicCursor++];
        return { dayIndex: idx + 1, postType, topic };
      }
      const asset = selectedAssets[assetCursor++];
      return { dayIndex: idx + 1, postType, asset };
    });

    const { system, messages } = buildOutlinePrompt(campaign, daySlots);

    let outlineEntries;
    let runStatus = "SUCCESS";
    let errorMessage = null;
    let usage = null;
    let latencyMs = null;

    try {
      const response = await callClaude({ system, messages, maxTokens: 4000 });
      usage = response.usage;
      latencyMs = response.latencyMs;
      outlineEntries = extractJson(response.text);
      if (!Array.isArray(outlineEntries) || outlineEntries.length !== daySlots.length) {
        throw new Error(`Expected ${daySlots.length} outline entries, got ${Array.isArray(outlineEntries) ? outlineEntries.length : "non-array"}`);
      }
    } catch (genErr) {
      runStatus = "FAILED";
      errorMessage = genErr.message;
    }

    await prisma.postGenerationRun.create({
      data: {
        campaignId: campaign.id,
        runType: "OUTLINE",
        model: ANTHROPIC_MODEL,
        promptVersion: PROMPT_VERSION,
        requestSummary: { dayCount: daySlots.length, insightCount: campaign.insightPostCount, assetCount: campaign.assetPostCount },
        responseSummary: runStatus === "SUCCESS" ? { entries: outlineEntries.length } : null,
        usageInputTokens: usage?.input_tokens ?? null,
        usageOutputTokens: usage?.output_tokens ?? null,
        latencyMs,
        status: runStatus,
        errorMessage,
      },
    });

    if (runStatus === "FAILED") {
      return res.status(502).json({ error: "GENERATION_INCOMPLETE", message: `Outline generation failed: ${errorMessage}` });
    }

    const entriesByDay = new Map(outlineEntries.map((e) => [Number(e.dayIndex), e]));

    const themes = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const slot of daySlots) {
        const entry = entriesByDay.get(slot.dayIndex) || {};
        const theme = await tx.campaignTheme.create({
          data: {
            campaignId: campaign.id,
            dayIndex: slot.dayIndex,
            postDate: addDays(campaign.startDate, slot.dayIndex - 1),
            postType: slot.postType,
            topicId: slot.topic?.id || null,
            assetId: slot.asset?.id || null,
            audienceSummary: entry.audienceSummary || "",
            centralPoint: entry.centralPoint || "",
            hookConcept: entry.hookConcept || "",
            ctaConcept: entry.ctaConcept || "",
            status: "DRAFT",
          },
        });
        created.push(theme);

        if (slot.topic) {
          await tx.insightTopic.update({ where: { id: slot.topic.id }, data: { lastUsedAt: new Date() } });
        }
        if (slot.asset) {
          await tx.educationalAsset.update({ where: { id: slot.asset.id }, data: { lastUsedAt: new Date() } });
        }
      }
      return created;
    });

    return res.status(200).json({ themeCount: themes.length, themes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DATABASE_WRITE_FAILURE", message: err?.message });
  }
}

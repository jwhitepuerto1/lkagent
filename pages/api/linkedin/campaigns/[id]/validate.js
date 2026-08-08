// pages/api/linkedin/campaigns/[id]/validate.js
import prisma from "../../../../../lib/prisma.js";
import { requireAuth } from "../../../../../lib/auth.js";
import { getOrCreatePlatformConfig } from "../../../../../lib/linkedinAgent/config.js";
import { runValidationForPost, runVariantCountCheck } from "../../../../../lib/linkedinAgent/validation.js";

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
    const campaign = await prisma.contentCampaign.findUnique({
      where: { id },
      include: {
        groupDestinations: true,
        themes: {
          orderBy: { dayIndex: "asc" },
          include: {
            topic: true,
            asset: true,
            generatedPosts: { include: { destination: true } },
          },
        },
      },
    });
    if (!campaign) return res.status(404).json({ error: "Not found" });

    const platformConfig = await getOrCreatePlatformConfig(prisma);
    const expectedVariantCount = 2 + campaign.groupDestinations.length;
    const cutoff = new Date(Date.now() - platformConfig.duplicateLookbackDays * 24 * 60 * 60 * 1000);

    let campaignAllPassed = true;
    const themeSummaries = [];

    for (const theme of campaign.themes) {
      let themeAllPassed = true;
      const postSummaries = [];

      for (const post of theme.generatedPosts) {
        const candidates = await prisma.generatedPost.findMany({
          where: {
            destinationId: post.destinationId,
            id: { not: post.id },
            createdAt: { gte: cutoff },
          },
          select: { id: true, postText: true, contentHash: true },
        });

        const { checks, validationStatus } = runValidationForPost({
          post,
          theme,
          topic: theme.topic,
          asset: theme.asset,
          destination: post.destination,
          candidates,
          platformConfig,
        });

        await prisma.contentValidationResult.deleteMany({ where: { generatedPostId: post.id } });
        await prisma.contentValidationResult.createMany({
          data: checks.map((check) => ({
            campaignId: campaign.id,
            campaignThemeId: theme.id,
            generatedPostId: post.id,
            checkCode: check.checkCode,
            passed: check.passed,
            reasonCode: check.reasonCode,
            message: check.message,
            details: check.details ?? undefined,
          })),
        });

        await prisma.generatedPost.update({ where: { id: post.id }, data: { validationStatus } });

        if (validationStatus !== "PASSED") themeAllPassed = false;
        postSummaries.push({ postId: post.id, destinationId: post.destinationId, validationStatus });
      }

      const variantCheck = runVariantCountCheck(theme, expectedVariantCount, theme.generatedPosts.length);
      await prisma.contentValidationResult.deleteMany({
        where: { campaignThemeId: theme.id, generatedPostId: null, checkCode: "VARIANT_COUNT" },
      });
      await prisma.contentValidationResult.create({
        data: {
          campaignId: campaign.id,
          campaignThemeId: theme.id,
          checkCode: "VARIANT_COUNT",
          passed: variantCheck.passed,
          reasonCode: variantCheck.reasonCode,
          message: variantCheck.message,
          details: variantCheck.details ?? undefined,
        },
      });
      if (!variantCheck.passed) themeAllPassed = false;

      await prisma.campaignTheme.update({
        where: { id: theme.id },
        data: { status: themeAllPassed ? "DRAFT" : "VALIDATION_FAILED" },
      });

      if (!themeAllPassed) campaignAllPassed = false;
      themeSummaries.push({ themeId: theme.id, dayIndex: theme.dayIndex, passed: themeAllPassed, variantCheck, posts: postSummaries });
    }

    await prisma.contentCampaign.update({
      where: { id: campaign.id },
      data: { status: campaignAllPassed ? "DRAFT" : "VALIDATION_FAILED" },
    });

    return res.status(200).json({ campaignId: campaign.id, allPassed: campaignAllPassed, themes: themeSummaries });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DATABASE_WRITE_FAILURE", message: err?.message });
  }
}

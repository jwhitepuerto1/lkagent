// pages/api/linkedin/campaigns/index.js
import prisma from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/auth.js";
import {
  CAMPAIGN_DAYS_ALLOWED,
  GROUP_COUNT_MIN,
  GROUP_COUNT_MAX,
} from "../../../../lib/linkedinAgent/constants.js";

function fail(res, status, reasonCode, message) {
  return res.status(status).json({ error: reasonCode, message });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  try {
    if (req.method === "GET") {
      const campaigns = await prisma.contentCampaign.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          personalDestination: true,
          companyDestination: true,
          groupDestinations: { include: { destination: true } },
          themes: true,
        },
      });
      return res.status(200).json(campaigns);
    }

    if (req.method === "POST") {
      const body = req.body || {};

      const campaignName = (body.campaignName || "").trim();
      const campaignDays = Number(body.campaignDays);
      const insightPostCount = Number(body.insightPostCount ?? 0);
      const assetPostCount = Number(body.assetPostCount ?? 0);
      const groupDestinationIds = Array.isArray(body.groupDestinationIds) ? body.groupDestinationIds : [];
      const personalDestinationId = body.personalDestinationId;
      const companyDestinationId = body.companyDestinationId;

      if (!campaignName) return fail(res, 400, "REQUIRED_FIELDS", "campaignName is required");

      if (!CAMPAIGN_DAYS_ALLOWED.includes(campaignDays)) {
        return fail(res, 400, "INVALID_CAMPAIGN_LENGTH", `campaignDays must be one of ${CAMPAIGN_DAYS_ALLOWED.join(", ")}`);
      }

      if (insightPostCount + assetPostCount !== campaignDays) {
        return fail(
          res,
          400,
          "COUNT_MISMATCH",
          `insightPostCount (${insightPostCount}) + assetPostCount (${assetPostCount}) must equal campaignDays (${campaignDays})`
        );
      }

      if (groupDestinationIds.length < GROUP_COUNT_MIN || groupDestinationIds.length > GROUP_COUNT_MAX) {
        return fail(
          res,
          400,
          "INVALID_GROUP_COUNT",
          `groupDestinationIds must contain between ${GROUP_COUNT_MIN} and ${GROUP_COUNT_MAX} groups`
        );
      }

      if (!personalDestinationId || !companyDestinationId) {
        return fail(res, 400, "REQUIRED_FIELDS", "personalDestinationId and companyDestinationId are required");
      }

      const [personal, company, groups] = await Promise.all([
        prisma.linkedinDestination.findUnique({ where: { id: personalDestinationId } }),
        prisma.linkedinDestination.findUnique({ where: { id: companyDestinationId } }),
        prisma.linkedinDestination.findMany({ where: { id: { in: groupDestinationIds } } }),
      ]);

      if (!personal || personal.destinationType !== "PERSONAL" || personal.status !== "ACTIVE") {
        return fail(res, 400, "DESTINATION_RULE_FAILURE", "personalDestinationId must reference an active PERSONAL destination");
      }
      if (!company || company.destinationType !== "COMPANY" || company.status !== "ACTIVE") {
        return fail(res, 400, "DESTINATION_RULE_FAILURE", "companyDestinationId must reference an active COMPANY destination");
      }
      if (groups.length !== groupDestinationIds.length || groups.some((g) => g.destinationType !== "GROUP" || g.status !== "ACTIVE")) {
        return fail(res, 400, "DESTINATION_RULE_FAILURE", "All groupDestinationIds must reference active GROUP destinations");
      }

      const topicSelectionMode = body.topicSelection?.mode === "specified" ? "SPECIFIED" : "AUTOMATIC";
      const assetSelectionMode = body.assetSelection?.mode === "specified" ? "SPECIFIED" : "AUTOMATIC";
      const topicSelectionConfig = {
        requiredTopicIds: body.topicSelection?.requiredTopicIds || [],
        excludedTopicIds: body.topicSelection?.excludedTopicIds || [],
        specifiedTopicIds: body.topicSelection?.topicIds || [],
      };
      const assetSelectionConfig = {
        requiredAssetIds: body.assetSelection?.requiredAssetIds || [],
        excludedAssetIds: body.assetSelection?.excludedAssetIds || [],
        specifiedAssetIds: body.assetSelection?.assetIds || [],
      };

      if (insightPostCount > 0) {
        if (topicSelectionMode === "SPECIFIED") {
          if (topicSelectionConfig.specifiedTopicIds.length !== insightPostCount) {
            return fail(res, 400, "INSUFFICIENT_TOPICS", "Number of specified topic IDs must equal insightPostCount");
          }
        } else {
          const eligible = await prisma.insightTopic.count({
            where: { active: true, id: { notIn: topicSelectionConfig.excludedTopicIds } },
          });
          if (eligible < insightPostCount) {
            return fail(res, 400, "INSUFFICIENT_TOPICS", `Only ${eligible} eligible active topics available, need ${insightPostCount}`);
          }
        }
      }

      if (assetPostCount > 0) {
        if (assetSelectionMode === "SPECIFIED") {
          if (assetSelectionConfig.specifiedAssetIds.length !== assetPostCount) {
            return fail(res, 400, "INSUFFICIENT_ASSETS", "Number of specified asset IDs must equal assetPostCount");
          }
        } else {
          const eligible = await prisma.educationalAsset.count({
            where: { active: true, id: { notIn: assetSelectionConfig.excludedAssetIds } },
          });
          if (eligible < assetPostCount) {
            return fail(res, 400, "INSUFFICIENT_ASSETS", `Only ${eligible} eligible active assets available, need ${assetPostCount}`);
          }
        }
      }

      const style = body.style || {};

      const campaign = await prisma.$transaction(async (tx) => {
        const created = await tx.contentCampaign.create({
          data: {
            campaignName,
            campaignDays,
            startDate: new Date(body.startDate),
            timezone: body.timezone || "America/New_York",
            insightPostCount,
            assetPostCount,
            personalDestinationId,
            companyDestinationId,
            topicSelectionMode,
            topicSelectionConfig,
            assetSelectionMode,
            assetSelectionConfig,
            styleTone: style.tone || "professional",
            stylePostLength: style.post_length || style.postLength || "standard",
            styleCtaStrength: style.cta_strength || style.ctaStrength || "standard",
            styleUseHashtags: style.use_hashtags ?? style.useHashtags ?? true,
            styleMaxHashtags: style.max_hashtags ?? style.maxHashtags ?? 3,
            styleIncludeQuestion: (style.include_question ?? style.includeQuestion) !== false,
            styleGroupPersonalizationLevel:
              style.group_personalization_level || style.groupPersonalizationLevel || "individual_group",
            status: "DRAFT",
          },
        });

        await tx.contentCampaignGroup.createMany({
          data: groupDestinationIds.map((destinationId) => ({ campaignId: created.id, destinationId })),
        });

        return created;
      });

      return res.status(201).json(campaign);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DATABASE_WRITE_FAILURE", message: err?.message });
  }
}

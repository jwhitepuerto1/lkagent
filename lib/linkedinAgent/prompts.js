// lib/linkedinAgent/prompts.js
import { CAPITAL_CONTEXT_VOICE_PRINCIPLES } from "./voicePrinciples.js";

function formatList(items) {
  const arr = Array.isArray(items) ? items : [];
  if (arr.length === 0) return "(none provided)";
  return arr.map((item) => `- ${item}`).join("\n");
}

function sourceSummary(theme) {
  if (theme.postType === "INSIGHT") {
    const topic = theme.topic;
    return [
      `Topic: ${topic.name}`,
      `Description: ${topic.description}`,
      `Approved angles:\n${formatList(topic.approvedAngles)}`,
      `Prohibited angles:\n${formatList(topic.prohibitedAngles)}`,
      `Target audiences:\n${formatList(topic.targetAudiences)}`,
      `Supporting facts / approved doctrine:\n${formatList(topic.supportingFacts)}`,
      topic.preferredCtaType ? `Preferred CTA type: ${topic.preferredCtaType}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  const asset = theme.asset;
  return [
    `Asset: ${asset.assetName} (${asset.assetType})`,
    `Short summary: ${asset.shortSummary}`,
    `Primary problem it addresses: ${asset.primaryProblem}`,
    `Source copy (approved, derive claims only from this):\n${asset.sourceCopy}`,
    `Learning outcomes:\n${formatList(asset.learningOutcomes)}`,
    `Target audiences:\n${formatList(asset.targetAudiences)}`,
    `Approved CTA: ${asset.approvedCta}`,
    `Canonical URL: ${asset.canonicalUrl}`,
  ].join("\n");
}

export function buildOutlinePrompt(campaign, daySlots) {
  const system = `You are the campaign planner for Capital Context's LinkedIn Post Generation Agent.

${CAPITAL_CONTEXT_VOICE_PRINCIPLES}

You will be given the campaign's day-by-day theme assignments (each day already has
its topic or educational asset pre-selected by a deterministic ranking algorithm —
you do NOT choose sources, only plan how to present them). For each day, produce an
outline entry: an audience summary, a central point, a hook concept, and a CTA
concept. Favor non-repeating hook patterns and CTA wording across the campaign, and
alternate variety between adjacent days where the content allows it.

Respond with ONLY a JSON array, no prose, no markdown fences, in this exact shape:
[{"dayIndex": 1, "audienceSummary": "...", "centralPoint": "...", "hookConcept": "...", "ctaConcept": "..."}, ...]
One entry per day, in dayIndex order, covering every day provided.`;

  const daysText = daySlots
    .map((slot) => `### Day ${slot.dayIndex} (${slot.postType})\n${sourceSummary(slot)}`)
    .join("\n\n");

  const userText = `Campaign: ${campaign.campaignName}
Length: ${campaign.campaignDays} days
Tone: ${campaign.styleTone}
Post length: ${campaign.stylePostLength}
CTA strength: ${campaign.styleCtaStrength}
Include question in posts where natural: ${campaign.styleIncludeQuestion}

${daysText}`;

  return { system, messages: [{ role: "user", content: userText }] };
}

const DESTINATION_VOICE_RULES = {
  PERSONAL: `Write in John White's personal voice: first person where natural, a
practitioner's direct observation or point of view, conversational but professional.
You may ask the reader for their experience or perspective. You may mention Capital
Context as context for the observation, but do not make every post a pitch.`,
  COMPANY: `Write in Capital Context's institutional voice: use "we" sparingly and
specifically, frame the issue as a repeatable operating or capital-raising problem,
state the value of the asset or insight clearly, and never write as if the company
Page were an individual.`,
  GROUP: `Write an educational, discussion-oriented post suited to this LinkedIn
Group's audience and terminology. Do not claim personal knowledge of the Group beyond
what is stated below. Preserve the same approved facts, URL, and central message as
the other destination versions of this theme, but do not reuse the same opening
sentence as any other Group version — vary the hook.`,
};

function urlInstruction(destination, hasUrl) {
  if (!hasUrl) {
    return "This post has no asset URL to include (insight post) — do not fabricate one.";
  }
  if (destination.urlPlacementPolicy === "top_and_bottom") {
    return "Include the canonical URL once near the top (within the first two lines) and again at the very end.";
  }
  return "Include the canonical URL exactly once, at the very end of the post.";
}

export function buildCopyPrompt({ theme, destination, campaign, priorOpeners = [] }) {
  const hasUrl = theme.postType === "ASSET";
  const voiceRule = DESTINATION_VOICE_RULES[destination.destinationType];

  const system = `You are the copywriter for Capital Context's LinkedIn Post Generation Agent, writing one destination-specific variant of an already-approved campaign theme.

${CAPITAL_CONTEXT_VOICE_PRINCIPLES}

Destination voice rules:
${voiceRule}

${destination.audienceDescription ? `Destination audience: ${destination.audienceDescription}` : ""}
${destination.rulesSummary ? `Destination rules: ${destination.rulesSummary}` : ""}

URL placement: ${urlInstruction(destination, hasUrl)}
Promotional links allowed at this destination: ${destination.promotionalLinksAllowed ? "yes" : "no"}

Style controls:
- Tone: ${campaign.styleTone}
- Post length: ${campaign.stylePostLength}
- CTA strength: ${campaign.styleCtaStrength}
- Hashtags: ${campaign.styleUseHashtags ? `use up to ${campaign.styleMaxHashtags}` : "do not use hashtags"}
- Include a question where natural: ${campaign.styleIncludeQuestion ? "yes" : "no"}

Never fabricate market data, statistics, client results, testimonials, capabilities,
or pricing. Do not turn every post into a sales pitch. Favor short paragraphs and
natural whitespace over dense walls of text.

${priorOpeners.length > 0 ? `Other Group versions of this same theme already opened with:\n${priorOpeners.map((o) => `- "${o}"`).join("\n")}\nDo not reuse or closely paraphrase any of these opening sentences.` : ""}

Respond with ONLY a JSON object, no prose, no markdown fences, in this exact shape:
{"postText": "...", "hashtags": ["...", ...], "urlIncluded": ${hasUrl ? '"the exact URL text as placed in postText"' : "null"}}`;

  const userText = `Theme post type: ${theme.postType}
Central point: ${theme.centralPoint}
Hook concept: ${theme.hookConcept}
CTA concept: ${theme.ctaConcept}

${sourceSummary(theme)}`;

  return { system, messages: [{ role: "user", content: userText }] };
}

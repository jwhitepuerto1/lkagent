// lib/linkedinEngagement/draftDm.js
// Drafts suggested first-DM text for a "DM / follow-up candidate" (spec
// 7.8's 20/20/20). DRAFT ONLY - this never sends anything. Per the agent's
// permanent read-only-against-LinkedIn design (see docs/linkedin-engagement/
// README.md "Deliberate scope cuts"), John copies the text and sends it
// himself; there is no send path anywhere in this codebase and none should
// be added without that decision being revisited explicitly.
import { callClaude } from "../linkedinAgent/anthropicClient.js";

const SYSTEM_PROMPT = `You draft short LinkedIn DM openers for John, who runs Capital Context (investor-acquisition systems for private commercial real estate sponsors, developers, syndicators, operators, and fund managers).

Rules:
- Write as John, first person, casual-professional tone - not corporate, not salesy, no "I hope this message finds you well."
- 2-4 sentences max. LinkedIn DMs that read like an email get ignored.
- Reference the SPECIFIC engagement context given (what they liked/commented, or that they just connected) - never write something generic that could apply to anyone.
- No hard pitch. The goal is starting a real conversation, not closing anything in the first message.
- Never invent facts about the recipient beyond what's given - if context is thin, keep the message correspondingly light rather than fabricating detail.
- Output ONLY the message text, no preamble, no quotation marks around it, no signature.`;

export async function draftDmMessage({ fullName, headline, companyName, primaryCategory, engagementContext }) {
  const userText = [
    `Recipient: ${fullName || "(unknown name)"}`,
    `Headline: ${headline || "(none)"}`,
    `Company: ${companyName || "(unknown)"}`,
    primaryCategory ? `Category: ${primaryCategory}` : null,
    engagementContext ? `Context: ${engagementContext}` : "Context: recently connected, no prior interaction on record.",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await callClaude({
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userText }],
    maxTokens: 300,
  });

  return response.text.trim();
}

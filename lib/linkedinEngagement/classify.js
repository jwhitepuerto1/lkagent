// lib/linkedinEngagement/classify.js
// LLM classifies and extracts evidence (spec 3.5: "Agents may identify and
// classify evidence. Agents must not independently determine final
// production scores.") - the deterministic scoring in scoring.js is what
// actually produces fit/engagement/priority scores from this classification.
import { callClaude, extractJson } from "../linkedinAgent/anthropicClient.js";

const CATEGORIES = [
  "CRE_SPONSOR_DEVELOPER",
  "REAL_ESTATE_FUND_MANAGER",
  "REAL_ESTATE_SYNDICATOR",
  "CRE_OPERATOR",
  "CAPITAL_RAISING_ADVISOR",
  "SECURITIES_OR_RE_ATTORNEY",
  "CPA_TAX_ADVISOR",
  "INVESTOR_CONTACT",
  "CRE_SERVICE_PROVIDER",
  "INDUSTRY_PUBLICATION_OR_INFLUENCER",
  "UNRELATED_LOW_RELEVANCE",
  "UNCLEAR_REVIEW_REQUIRED",
];

const SYSTEM_PROMPT = `You classify LinkedIn people for Capital Context, which builds investor-acquisition systems for private commercial real estate (CRE) sponsors, developers, syndicators, operators, and fund managers.

Assign exactly one primary category and zero or more secondary categories from this list:
${CATEGORIES.join(", ")}

Category meanings:
- CRE_SPONSOR_DEVELOPER: runs or develops CRE deals, raises capital from investors for them.
- REAL_ESTATE_FUND_MANAGER: manages a real estate investment fund.
- REAL_ESTATE_SYNDICATOR: syndicates CRE deals (pools investor capital for specific properties).
- CRE_OPERATOR: operates/manages CRE assets, not necessarily raising capital.
- CAPITAL_RAISING_ADVISOR: helps sponsors raise capital (consultant, placement agent, etc.), not a sponsor themselves.
- SECURITIES_OR_RE_ATTORNEY: attorney working in securities or real estate law.
- CPA_TAX_ADVISOR: CPA or tax advisor serving CRE sponsors.
- INVESTOR_CONTACT: HNW/UHNW individual, family office, RIA, or other capital source - NOT a sponsor prospect, route toward investor-side workflows instead.
- CRE_SERVICE_PROVIDER: vendor/service provider to the CRE industry (lender, broker, property manager, etc.) who is not themselves a sponsor.
- INDUSTRY_PUBLICATION_OR_INFLUENCER: media, association, or content creator in the CRE space.
- UNRELATED_LOW_RELEVANCE: no meaningful relevance to Capital Context's business.
- UNCLEAR_REVIEW_REQUIRED: insufficient information to classify confidently.

Base the classification only on the evidence given - headline, company, location, and any provided message/comment text. Never invent facts not present in the input.

Respond with ONLY a JSON object, no prose, no markdown fences:
{"primaryCategory": "...", "secondaryCategories": ["..."], "confidence": 0.0-1.0, "evidence": ["short factual reason", "..."]}`;

export async function classifyPerson({ fullName, headline, companyName, location, contextText }) {
  const userText = [
    `Name: ${fullName || "(unknown)"}`,
    `Headline: ${headline || "(none)"}`,
    `Company: ${companyName || "(unknown)"}`,
    `Location: ${location || "(unknown)"}`,
    contextText ? `Recent message/comment text from this person: ${contextText}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await callClaude({
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userText }],
    maxTokens: 500,
  });

  const parsed = extractJson(response.text);
  if (!CATEGORIES.includes(parsed.primaryCategory)) {
    parsed.primaryCategory = "UNCLEAR_REVIEW_REQUIRED";
    parsed.confidence = Math.min(parsed.confidence ?? 0.3, 0.3);
  }
  parsed.secondaryCategories = (parsed.secondaryCategories || []).filter((c) => CATEGORIES.includes(c));
  return parsed;
}

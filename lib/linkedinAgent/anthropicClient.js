// lib/linkedinAgent/anthropicClient.js
// Thin fetch-based wrapper around the Anthropic Messages API. No SDK
// dependency added — Node's global fetch is sufficient for one call site.
import { ANTHROPIC_MODEL } from "./constants.js";

export async function callClaude({ system, messages, maxTokens = 1500 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable LinkedIn copy generation."
    );
  }

  const startedAt = Date.now();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  const latencyMs = Date.now() - startedAt;

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.content?.find((block) => block.type === "text")?.text ?? "";

  return {
    text,
    usage: data?.usage || null,
    model: data?.model || ANTHROPIC_MODEL,
    latencyMs,
  };
}

// Claude is instructed to return strict JSON but sometimes wraps it in prose
// or a fenced code block. Defensive extraction before JSON.parse.
export function extractJson(text) {
  const trimmed = String(text || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through to fence/bracket extraction
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // fall through
    }
  }

  const firstBracket = trimmed.search(/[[{]/);
  const lastBracket = Math.max(trimmed.lastIndexOf("]"), trimmed.lastIndexOf("}"));
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1));
    } catch {
      // fall through
    }
  }

  throw new Error("Could not parse JSON from model response");
}

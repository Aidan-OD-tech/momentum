import "server-only";
import OpenAI from "openai";

// The only place that reads the OpenAI key. Never import this file from browser code: the
// "server-only" import above makes the build fail if anything tries.

// Used when OPENAI_MODEL isn't set. Chosen in M4's live checks (see docs/decisions.md).
export const DEFAULT_MODEL = "gpt-4.1-mini";

// Enough for a 12-step plan with room to spare, small enough to bound the cost of one request.
export const MAX_OUTPUT_TOKENS = 4_000;

// Null when the key isn't set; the route then answers "failed" (Error 03).
export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  // No retries (scope item 7): one request, and Error 03 with Try again if it fails.
  return new OpenAI({ apiKey, maxRetries: 0 });
}

export function planModel(): string {
  return process.env.OPENAI_MODEL || DEFAULT_MODEL;
}

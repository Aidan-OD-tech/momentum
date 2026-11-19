// The longest brief Momentum sends to the model, in characters. Shared by brief entry (the counter and
// the over-limit message, which blocks the build) and the server route (the real guard, which answers
// 413 above it). See docs/decisions.md, M4 and M6.
export const MAX_BRIEF_CHARS = 12_000;

// The character count shows once the brief is within 10% of the limit.
export const BRIEF_COUNT_FROM = Math.round(MAX_BRIEF_CHARS * 0.9);

// A brief's length as every check counts it: the counter, the over-limit message and the server's 413.
// Leading and trailing whitespace isn't sent as part of the brief, so it isn't counted.
export function briefLength(text: string): number {
  return text.trim().length;
}

// The most briefs one upload can hold (M7c). Each is one /api/plan request, sent one at a time.
export const MAX_BRIEFS = 8;

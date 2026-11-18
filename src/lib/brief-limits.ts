// The longest brief Momentum sends to the model, in characters. Shared by the text area (maxLength)
// and the server route (the real guard, which answers 413 above it). See docs/decisions.md, M4.
export const MAX_BRIEF_CHARS = 12_000;

// The character count shows once the brief is within 10% of the limit.
export const BRIEF_COUNT_FROM = Math.round(MAX_BRIEF_CHARS * 0.9);

// "Use a sample brief" shows only when NEXT_PUBLIC_SHOW_SAMPLE_BRIEF is "true" (decision 2026-11-18).
// Unset, it is hidden, which is what the M5 sessions need: participants paste the brief themselves.
// Aidan turns it back on for the case-study demo. Not a secret, so NEXT_PUBLIC_ is fine; Next.js
// writes the value into the browser code at build time, so changing it needs a new deployment.
export function showSampleBrief(flag: string | undefined = process.env.NEXT_PUBLIC_SHOW_SAMPLE_BRIEF): boolean {
  return flag === "true";
}

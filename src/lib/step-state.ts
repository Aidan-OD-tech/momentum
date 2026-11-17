// How a step is shown in the M1 preview. Nothing is stored: the step number in the URL decides it.
// Steps before n are done, step n is in progress, later steps are upcoming.

export type StepDisplayState = "done" | "current" | "upcoming";

// Display state of every step when the user is on step n (1-based).
export function getStepDisplayStates(stepCount: number, n: number): StepDisplayState[] {
  return Array.from({ length: stepCount }, (_, index) => {
    const stepNumber = index + 1;
    if (stepNumber < n) return "done";
    if (stepNumber === n) return "current";
    return "upcoming";
  });
}

// Turns the URL part into a step number, or null when it is not a whole number from 1 to stepCount.
// Only plain digits are accepted, so "03", "3.5", "1e1" and "abc" are all rejected.
export function parseStepNumber(param: string, stepCount: number): number | null {
  if (!/^[1-9]\d*$/.test(param)) return null;
  const n = Number(param);
  return n <= stepCount ? n : null;
}

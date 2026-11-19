import { progressLabel } from "@/components/Progress";
import { formatDay, formatSavedAt, formatTotalMinutes } from "@/lib/format";
import { remainingMinutes } from "@/lib/priority";
import { countDoneSteps, inProgressStepNumber, nextStepNumber } from "@/lib/step-state";
import type { Assignment } from "@/lib/types";

// The words and links of the home list (M7b). Pure functions, no React. The order is in priority.ts.

const stepCount = (n: number) => `${n} ${n === 1 ? "step" : "steps"}`;

// "About 2 h 30 min": the estimates of the steps not done, so always approximate.
export function aboutTimeLeft(assignment: Assignment): string {
  return `About ${formatTotalMinutes(remainingMinutes(assignment))}`;
}

// The status line of a current assignment's row.
export function currentStatusLine(assignment: Assignment, now: Date = new Date()): string {
  const total = assignment.steps.length;
  const done = countDoneSteps(assignment);
  const pausedN = inProgressStepNumber(assignment);
  if (assignment.status === "review") return `Plan ready · ${stepCount(total)} · ${aboutTimeLeft(assignment)}`;
  if (done === total) return "All steps done · Final check next";
  const progress = `${progressLabel(done, total)} · ${aboutTimeLeft(assignment)} of steps left`;
  if (pausedN) {
    const step = assignment.steps[pausedN - 1];
    const note = step.note && step.noteSavedAt ? ` · note ${formatSavedAt(step.noteSavedAt, now)}` : "";
    return `Paused at step ${pausedN} · ${progress}${note}`;
  }
  if (done === 0) return `Not started · ${stepCount(total)} · ${aboutTimeLeft(assignment)}`;
  return progress;
}

// The status line of a finished assignment's row.
export function finishedStatusLine(assignment: Assignment): string {
  return assignment.finalReviewedAt ? `Final check reviewed ${formatDay(assignment.finalReviewedAt)}` : "All steps done";
}

// Where a current assignment's row button goes: the plan in review, the step in progress,
// else the next step, else the final check.
export function openPath(assignment: Assignment): string {
  if (assignment.status === "review") return "/plan";
  const n = inProgressStepNumber(assignment) ?? nextStepNumber(assignment);
  return n ? `/step/${n}` : "/final";
}

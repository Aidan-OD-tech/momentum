import type { Assignment, Requirement, RequirementKind } from "@/lib/types";

// Turns the URL part into a step number, or null when it is not a plain positive whole number.
// "03", "3.5", "-1", "1e1" and "abc" are rejected. Whether the number exists in the plan is checked
// on the client, because only the browser knows the stored plan.
export function parseStepParam(param: string): number | null {
  return /^[1-9]\d{0,5}$/.test(param) ? Number(param) : null;
}

export function countDoneSteps(assignment: Assignment): number {
  return assignment.steps.filter((step) => step.status === "done").length;
}

export function allStepsDone(assignment: Assignment): boolean {
  return assignment.steps.every((step) => step.status === "done");
}

// The step home offers to resume. If more than one step is in progress, the lowest-numbered one wins.
export function inProgressStepNumber(assignment: Assignment): number | null {
  const index = assignment.steps.findIndex((step) => step.status === "inProgress");
  return index === -1 ? null : index + 1;
}

// The first step that isn't done, looking after step `afterN` first and then from the start.
// Null when every step is done.
export function nextStepNumber(assignment: Assignment, afterN = 0): number | null {
  const notDone = assignment.steps.map((step, index) => (step.status === "done" ? null : index + 1));
  const later = notDone.find((n) => n !== null && n > afterN);
  return later ?? notDone.find((n) => n !== null) ?? null;
}

export function totalEstimateMinutes(assignment: Assignment): number {
  return assignment.steps.reduce((sum, step) => sum + step.estimateMin, 0);
}

const KIND_ORDER: Record<RequirementKind, number> = { substantive: 0, format: 1, submission: 2 };

// Substantive requirements first, then format, then submission. Within a kind the original order is kept.
export function substantiveFirst(requirements: Requirement[]): Requirement[] {
  return [...requirements].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
}

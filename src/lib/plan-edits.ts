import type { PlanStep, Requirement } from "@/lib/types";

// Pure helpers for the plan review edit cards, kept apart from React so they can be tested directly.

// The edit card's working copy of a step.
export type StepDraft = { title: string; whatToDo: string[]; doneWhen: string; estimateMin: number };

// A step the student adds (Add a step): nothing filled in yet, 15 minutes.
export const NEW_STEP_DRAFT: StepDraft = { title: "", whatToDo: [], doneWhen: "", estimateMin: 15 };

export type StepErrors = { title?: string; doneWhen?: string };

// A step needs a title and a Done when. DEVELOPMENT COPY: no Figma frame shows these errors.
export function validateStep(draft: StepDraft): StepErrors {
  const errors: StepErrors = {};
  if (!draft.title.trim()) errors.title = "Add a title.";
  if (!draft.doneWhen.trim()) errors.doneWhen = "Add a Done when.";
  return errors;
}

// The draft as a plan step: text trimmed, empty "What to do" items dropped. Fields the card doesn't
// edit (intro, completedSummary) are left out, so updateStep keeps the step's own.
export function stepFromDraft(id: string, draft: StepDraft): PlanStep {
  return {
    id,
    title: draft.title.trim(),
    whatToDo: draft.whatToDo.map((item) => item.trim()).filter(Boolean),
    doneWhen: draft.doneWhen.trim(),
    estimateMin: draft.estimateMin,
  };
}

// One row in the requirements edit card. id is null for a row the student added.
export type RequirementRow = { id: string | null; label: string };

// Turns the edited rows back into requirements:
// - empty rows are dropped;
// - an unchanged row keeps everything it had, including its kind and shortLabel;
// - a changed label clears shortLabel, so the short "From your brief" line never disagrees with it;
// - an added row is substantive (Aidan's decision), with an id from newId().
export function applyRequirementRows(original: Requirement[], rows: RequirementRow[], newId: () => string): Requirement[] {
  return rows.flatMap((row) => {
    const label = row.label.trim();
    if (!label) return [];
    const before = original.find((requirement) => requirement.id === row.id);
    if (!before) return [{ id: newId(), label, kind: "substantive" as const }];
    if (before.label === label) return [before];
    return [{ id: before.id, label, kind: before.kind }];
  });
}

export function sameRequirements(a: Requirement[], b: Requirement[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Data model from the handoff ("Suggested local data model"): one versioned object.
// Additions beyond the handoff are recorded in docs/decisions.md.

export type RequirementKind = "substantive" | "format" | "submission";

export type Requirement = {
  id: string;
  label: string;
  kind: RequirementKind;
  // Short form for the collapsed "From your brief" line, e.g. "APA 7th".
  shortLabel?: string;
};

export type StepStatus = "upcoming" | "inProgress" | "done";

export type Step = {
  id: string;
  title: string;
  // Context line under the step title.
  intro?: string;
  whatToDo: string[];
  // The criterion only. The "Done when" label is added by the component.
  doneWhen: string;
  // The line under "Step N done." on the step-complete screen. Omitted when missing.
  completedSummary?: string;
  estimateMin: number;
  status: StepStatus;
  // Empty string means no note.
  note: string;
  noteSavedAt: string | null;
  noteHidden: boolean;
  // Text typed in the pause dialog but not saved with Finish for now. Kept apart from `note`
  // so a refresh doesn't lose it. Undefined means there is no draft.
  pauseDraft?: string;
};

// review: the plan exists and hasn't started; the only state that can be edited.
// active: set by Start step 1. completed: set by Finish review.
export type AssignmentStatus = "review" | "active" | "completed";

export type Assignment = {
  id: string;
  status: AssignmentStatus;
  // The pasted brief text.
  brief: string;
  // Local date and time like "2026-12-04T17:00". Optional.
  deadline?: string;
  course?: string;
  title: string;
  summary: string;
  requirements: Requirement[];
  steps: Step[];
  // Requirement id -> ticked.
  finalChecks: Record<string, boolean>;
  lastUndo: { stepId: string; previous: Partial<Step> } | null;
  completedAt: string | null;
  finalReviewedAt: string | null;
  // When the plan was created (M5). Optional: plans saved before M5 don't have it.
  planCreatedAt?: string;
  // When Start step 1 was pressed (M5). Set once, so first_step_started is sent at most once per plan.
  firstStepStartedAt?: string;
};

// What the student has typed on brief entry, kept until a plan is created.
// deadline is the datetime-local value ("2026-12-04T17:00") or "" when blank.
export type BriefDraft = { text: string; deadline: string };

export type MomentumData = {
  version: 1;
  // null means no assignment is open: "/" shows brief entry.
  activeAssignmentId: string | null;
  assignments: Assignment[];
  // Added in M3. Optional, so data saved by M2 still loads as version 1.
  briefDraft?: BriefDraft;
};

// A plan as a PlanSource returns it, before the student has started or edited anything.
export type PlanStep = Pick<Step, "id" | "title" | "intro" | "whatToDo" | "doneWhen" | "completedSummary" | "estimateMin">;

export type PlanDraft = {
  title: string;
  course?: string;
  summary: string;
  deadline?: string;
  requirements: Requirement[];
  steps: PlanStep[];
};

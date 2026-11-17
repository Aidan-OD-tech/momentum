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

export type AssignmentStatus = "active" | "completed";

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
};

export type MomentumData = {
  version: 1;
  activeAssignmentId: string | null;
  assignments: Assignment[];
};

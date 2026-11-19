import { keptDrafts, readBriefDrafts, sameDrafts, withDrafts } from "@/lib/brief-drafts";
import type { Assignment, BriefDraftItem, MomentumData, PlanDraft, PlanStep, Requirement, Step } from "@/lib/types";

// Every rule for changing Momentum's data lives here, as a pure function, so it can be tested without React.
// Steps are addressed by number n (1-based), like the URLs. Actions apply to the active assignment.
// Timestamps and ids come in with the action, which keeps the reducer pure.

export type Action =
  | { type: "openStep"; n: number }
  | { type: "completeStep"; n: number }
  | { type: "undo" }
  | { type: "finishForNow"; n: number; noteText: string; at: string }
  | { type: "setPauseDraft"; n: number; text: string }
  | { type: "setNoteHidden"; n: number; hidden: boolean }
  | { type: "toggleFinalCheck"; requirementId: string }
  | { type: "finishReview"; at: string }
  // Several assignments (M7).
  | { type: "openAssignment"; id: string }
  // Brief entry and plan review (M3). Several briefs at once (M7c).
  | { type: "setBriefDrafts"; drafts: BriefDraftItem[] }
  | { type: "createPlan"; id: string; plan: PlanDraft; brief: string; deadlineOverride: string; at: string }
  | { type: "addPlanFromDraft"; draftId: string; id: string; plan: PlanDraft; brief: string; deadlineOverride: string; at: string }
  | { type: "updateStep"; n: number; step: PlanStep }
  | { type: "addStep"; step: PlanStep }
  | { type: "deleteStep"; n: number }
  | { type: "updateRequirements"; requirements: Requirement[] }
  | { type: "startPlan"; at: string };

// Estimates are whole minutes in steps of 5, at least 5 (handoff "By screen" 3).
export function clampEstimate(minutes: number): number {
  return Math.max(5, Math.round(minutes / 5) * 5);
}

// A plan step as stored: upcoming, with no note.
function newStep(step: PlanStep): Step {
  return { ...step, estimateMin: clampEstimate(step.estimateMin), status: "upcoming", note: "", noteSavedAt: null, noteHidden: false };
}

type NewPlan = { id: string; plan: PlanDraft; brief: string; deadlineOverride: string; at: string };

// A new assignment in review, from a built plan. Shared by createPlan and addPlanFromDraft.
function newAssignment({ id, plan, brief, deadlineOverride, at }: NewPlan): Assignment {
  return {
    id,
    status: "review",
    brief,
    // A deadline the student typed wins over the one found in the brief; blank keeps the plan's.
    deadline: deadlineOverride.trim() || plan.deadline,
    course: plan.course,
    title: plan.title,
    summary: plan.summary,
    requirements: plan.requirements,
    steps: plan.steps.map(newStep),
    finalChecks: {},
    lastUndo: null,
    completedAt: null,
    finalReviewedAt: null,
    planCreatedAt: at,
  };
}

export function getActiveAssignment(data: MomentumData): Assignment | undefined {
  return data.assignments.find((assignment) => assignment.id === data.activeAssignmentId);
}

function replaceActive(data: MomentumData, next: Assignment): MomentumData {
  return { ...data, assignments: data.assignments.map((a) => (a.id === next.id ? next : a)) };
}

function replaceStep(assignment: Assignment, n: number, next: Step): Assignment {
  return { ...assignment, steps: assignment.steps.map((step, index) => (index === n - 1 ? next : step)) };
}

export function reducer(data: MomentumData, action: Action): MomentumData {
  const assignment = getActiveAssignment(data);

  if (action.type === "openAssignment") {
    // Only changes which assignment is open, never the assignments themselves.
    const exists = data.assignments.some((a) => a.id === action.id);
    return !exists || data.activeAssignmentId === action.id ? data : { ...data, activeAssignmentId: action.id };
  }
  if (action.type === "setBriefDrafts") {
    // Empty cards aren't stored, so a first visit writes nothing until the student types. An unchanged
    // list writes nothing either, even in the old shape: storage is only rewritten when a draft changes.
    const next = keptDrafts(action.drafts);
    return sameDrafts(next, readBriefDrafts(data)) ? data : withDrafts(data, next);
  }
  if (action.type === "createPlan") {
    // The single-brief path: the plan opens in review, and the drafts have become a plan, so they are cleared.
    const created = newAssignment(action);
    return { ...withDrafts(data, []), activeAssignmentId: created.id, assignments: [...data.assignments, created] };
  }
  if (action.type === "addPlanFromDraft") {
    // Several briefs: each plan is added as it arrives, without opening it, and only its own draft goes.
    const created = newAssignment(action);
    const drafts = readBriefDrafts(data).filter((draft) => draft.id !== action.draftId);
    return { ...withDrafts(data, drafts), assignments: [...data.assignments, created] };
  }
  if (!assignment) return data;

  // Plan edits are only allowed before Start step 1.
  const inReview = assignment.status === "review";

  switch (action.type) {
    case "updateStep": {
      const step = assignment.steps[action.n - 1];
      if (!inReview || !step) return data;
      // Only the plan fields change; the step keeps its status and note fields.
      const next = { ...step, ...action.step, id: step.id, estimateMin: clampEstimate(action.step.estimateMin) };
      return replaceActive(data, replaceStep(assignment, action.n, next));
    }

    case "addStep": {
      if (!inReview) return data;
      return replaceActive(data, { ...assignment, steps: [...assignment.steps, newStep(action.step)] });
    }

    case "deleteStep": {
      // A plan always keeps at least one step.
      if (!inReview || !assignment.steps[action.n - 1] || assignment.steps.length === 1) return data;
      return replaceActive(data, { ...assignment, steps: assignment.steps.filter((_, index) => index !== action.n - 1) });
    }

    case "updateRequirements": {
      // Replaces the list (which feeds the final check). Never touches the steps (handoff decision 3).
      if (!inReview) return data;
      return replaceActive(data, { ...assignment, requirements: action.requirements });
    }

    case "startPlan": {
      if (!inReview || assignment.steps.length === 0) return data;
      const [first, ...rest] = assignment.steps;
      return replaceActive(data, {
        ...assignment,
        status: "active",
        steps: [{ ...first, status: "inProgress" }, ...rest],
        // Kept if already set, so it always records the first start.
        firstStepStartedAt: assignment.firstStepStartedAt ?? action.at,
      });
    }

    case "openStep": {
      const step = assignment.steps[action.n - 1];
      if (!step || step.status === "done") return data;
      // Starting a different step ends the chance to undo the last completion.
      const keepUndo = assignment.lastUndo?.stepId === step.id;
      if (step.status === "inProgress" && (keepUndo || !assignment.lastUndo)) return data;
      const opened = { ...step, status: "inProgress" as const };
      return replaceActive(data, { ...replaceStep(assignment, action.n, opened), lastUndo: keepUndo ? assignment.lastUndo : null });
    }

    case "completeStep": {
      const step = assignment.steps[action.n - 1];
      if (!step || step.status === "done") return data;
      const previous = { status: step.status, note: step.note, noteSavedAt: step.noteSavedAt, noteHidden: step.noteHidden };
      return replaceActive(data, {
        ...replaceStep(assignment, action.n, { ...step, status: "done" }),
        lastUndo: { stepId: step.id, previous },
      });
    }

    case "undo": {
      const lastUndo = assignment.lastUndo;
      if (!lastUndo) return data;
      const n = assignment.steps.findIndex((step) => step.id === lastUndo.stepId) + 1;
      if (n === 0) return data;
      const restored = { ...assignment.steps[n - 1], ...lastUndo.previous };
      return replaceActive(data, { ...replaceStep(assignment, n, restored), lastUndo: null });
    }

    case "finishForNow": {
      const step = assignment.steps[action.n - 1];
      if (!step) return data;
      const text = action.noteText.trim();
      // Empty means no note: an existing note is deleted. The step stays as it is (in progress).
      const next: Step = text
        ? { ...step, note: text, noteSavedAt: action.at, noteHidden: false, pauseDraft: undefined }
        : { ...step, note: "", noteSavedAt: null, noteHidden: false, pauseDraft: undefined };
      return replaceActive(data, replaceStep(assignment, action.n, next));
    }

    case "setPauseDraft": {
      const step = assignment.steps[action.n - 1];
      if (!step || step.pauseDraft === action.text) return data;
      return replaceActive(data, replaceStep(assignment, action.n, { ...step, pauseDraft: action.text }));
    }

    case "setNoteHidden": {
      const step = assignment.steps[action.n - 1];
      if (!step || step.noteHidden === action.hidden) return data;
      return replaceActive(data, replaceStep(assignment, action.n, { ...step, noteHidden: action.hidden }));
    }

    case "toggleFinalCheck": {
      const checked = !assignment.finalChecks[action.requirementId];
      return replaceActive(data, { ...assignment, finalChecks: { ...assignment.finalChecks, [action.requirementId]: checked } });
    }

    case "finishReview": {
      // Finishing the review records that the student looked at the checklist. Ticks don't need to be complete,
      // and it never means the assignment was submitted.
      return replaceActive(data, {
        ...assignment,
        status: "completed",
        finalReviewedAt: action.at,
        completedAt: action.at,
        lastUndo: null,
      });
    }
  }
}

import type { Assignment, BriefDraft, MomentumData, PlanDraft, PlanStep, Requirement, Step } from "@/lib/types";

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
  | { type: "startNewAssignment" }
  // Brief entry and plan review (M3).
  | { type: "setBriefDraft"; draft: BriefDraft }
  | { type: "createPlan"; id: string; plan: PlanDraft; brief: string; deadlineOverride: string }
  | { type: "updateStep"; n: number; step: PlanStep }
  | { type: "addStep"; step: PlanStep }
  | { type: "deleteStep"; n: number }
  | { type: "updateRequirements"; requirements: Requirement[] }
  | { type: "startPlan" };

// Estimates are whole minutes in steps of 5, at least 5 (handoff "By screen" 3).
export function clampEstimate(minutes: number): number {
  return Math.max(5, Math.round(minutes / 5) * 5);
}

// A plan step as stored: upcoming, with no note.
function newStep(step: PlanStep): Step {
  return { ...step, estimateMin: clampEstimate(step.estimateMin), status: "upcoming", note: "", noteSavedAt: null, noteHidden: false };
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

  if (action.type === "startNewAssignment") {
    // No open assignment means "/" shows brief entry. The completed record stays in `assignments`.
    return { ...data, activeAssignmentId: null };
  }
  if (action.type === "setBriefDraft") {
    // No stored draft counts as an empty one, so a first visit writes nothing until the student types.
    const same = (data.briefDraft?.text ?? "") === action.draft.text && (data.briefDraft?.deadline ?? "") === action.draft.deadline;
    return same ? data : { ...data, briefDraft: action.draft };
  }
  if (action.type === "createPlan") {
    const { plan } = action;
    // A deadline the student typed wins over the one found in the brief; blank keeps the plan's.
    const deadline = action.deadlineOverride.trim() || plan.deadline;
    const created: Assignment = {
      id: action.id,
      status: "review",
      brief: action.brief,
      deadline,
      course: plan.course,
      title: plan.title,
      summary: plan.summary,
      requirements: plan.requirements,
      steps: plan.steps.map(newStep),
      finalChecks: {},
      lastUndo: null,
      completedAt: null,
      finalReviewedAt: null,
    };
    // The draft has become a plan, so it is cleared.
    return { ...data, activeAssignmentId: created.id, assignments: [...data.assignments, created], briefDraft: undefined };
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
      return replaceActive(data, { ...assignment, status: "active", steps: [{ ...first, status: "inProgress" }, ...rest] });
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

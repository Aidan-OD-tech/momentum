import { createSampleAssignment } from "@/data/sample-assignment";
import type { Assignment, MomentumData, Step } from "@/lib/types";

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
  | { type: "startNewAssignment"; newId: string };

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
    // M3: this becomes "open brief entry". Until then, a fresh copy of the sample plan.
    return {
      ...data,
      activeAssignmentId: action.newId,
      assignments: [...data.assignments, createSampleAssignment(action.newId)],
    };
  }
  if (!assignment) return data;

  switch (action.type) {
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

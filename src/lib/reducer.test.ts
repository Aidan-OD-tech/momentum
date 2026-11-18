import { describe, expect, it } from "vitest";
import { createSamplePlan } from "@/data/sample-assignment";
import { getActiveAssignment, reducer, type Action } from "@/lib/reducer";
import { load, save } from "@/lib/storage";
import { allStepsDone, countDoneSteps } from "@/lib/step-state";
import type { MomentumData } from "@/lib/types";
import { makeAssignment, makeData, memoryStorage } from "@/test/fixtures";

const AT = "2026-11-17T10:00:00.000Z";
const run = (data: MomentumData, ...actions: Action[]) => actions.reduce(reducer, data);
const active = (data: MomentumData) => getActiveAssignment(data)!;
const step = (data: MomentumData, n: number) => active(data).steps[n - 1];

describe("openStep", () => {
  it("sets an upcoming step in progress", () => {
    expect(step(run(makeData(), { type: "openStep", n: 2 }), 2).status).toBe("inProgress");
  });

  it("leaves a done step done, and returns the same object when nothing changes", () => {
    const data = run(makeData(), { type: "openStep", n: 1 }, { type: "completeStep", n: 1 });
    expect(reducer(data, { type: "openStep", n: 1 })).toBe(data);
  });
});

describe("completeStep and undo", () => {
  it("undo restores status, note, noteSavedAt and noteHidden exactly", () => {
    const before = run(
      makeData(),
      { type: "openStep", n: 3 },
      { type: "finishForNow", n: 3, noteText: "Thesis drafted", at: AT },
      { type: "setNoteHidden", n: 3, hidden: true },
    );
    const done = reducer(before, { type: "completeStep", n: 3 });
    expect(step(done, 3).status).toBe("done");
    expect(active(done).lastUndo?.stepId).toBe("s3");

    // Change the done step's note fields, so only a real restore from lastUndo brings them back.
    const changed = run(done, { type: "setNoteHidden", n: 3, hidden: false }, { type: "finishForNow", n: 3, noteText: "", at: AT });
    expect(step(changed, 3)).toMatchObject({ note: "", noteHidden: false });

    const undone = reducer(changed, { type: "undo" });
    const { status, note, noteSavedAt, noteHidden } = step(undone, 3);
    expect({ status, note, noteSavedAt, noteHidden }).toEqual({
      status: "inProgress",
      note: "Thesis drafted",
      noteSavedAt: AT,
      noteHidden: true,
    });
    expect(active(undone).lastUndo).toBeNull();
  });

  it("undo is no longer offered after the next step is opened", () => {
    const data = run(makeData(), { type: "openStep", n: 1 }, { type: "completeStep", n: 1 }, { type: "openStep", n: 2 });
    expect(active(data).lastUndo).toBeNull();
    expect(step(reducer(data, { type: "undo" }), 1).status).toBe("done");
  });

  it("viewing the completed step again keeps undo available", () => {
    const data = run(makeData(), { type: "openStep", n: 1 }, { type: "completeStep", n: 1 }, { type: "openStep", n: 1 });
    expect(active(data).lastUndo?.stepId).toBe("s1");
  });

  it("undo works from the final check, and is gone after finishReview", () => {
    let data = makeData(3);
    for (const n of [1, 2, 3]) data = run(data, { type: "openStep", n }, { type: "completeStep", n });
    expect(allStepsDone(active(data))).toBe(true);
    expect(active(data).lastUndo?.stepId).toBe("s3");

    const undone = reducer(data, { type: "undo" });
    expect(step(undone, 3).status).toBe("inProgress");

    const reviewed = run(undone, { type: "completeStep", n: 3 }, { type: "finishReview", at: AT });
    expect(active(reviewed).lastUndo).toBeNull();
    expect(active(reviewed)).toMatchObject({ status: "completed", finalReviewedAt: AT, completedAt: AT });
  });
});

describe("finishForNow and the pause draft", () => {
  const withNote = () =>
    run(makeData(), { type: "openStep", n: 3 }, { type: "finishForNow", n: 3, noteText: "Old note", at: AT });

  it("empty text deletes an existing note", () => {
    const data = reducer(withNote(), { type: "finishForNow", n: 3, noteText: "   ", at: AT });
    expect(step(data, 3)).toMatchObject({ note: "", noteSavedAt: null, status: "inProgress" });
  });

  it("text is trimmed and saved, unhides the note and clears the draft", () => {
    const data = run(
      withNote(),
      { type: "setNoteHidden", n: 3, hidden: true },
      { type: "setPauseDraft", n: 3, text: "typing" },
      { type: "finishForNow", n: 3, noteText: "  New note  ", at: "2026-11-18T09:00:00.000Z" },
    );
    expect(step(data, 3)).toMatchObject({ note: "New note", noteSavedAt: "2026-11-18T09:00:00.000Z", noteHidden: false });
    expect(step(data, 3).pauseDraft).toBeUndefined();
    expect(step(data, 3).status).toBe("inProgress");
  });

  it("saving a draft (what closing the dialog does) keeps the saved note", () => {
    const data = reducer(withNote(), { type: "setPauseDraft", n: 3, text: "half a thought" });
    expect(step(data, 3)).toMatchObject({ note: "Old note", noteSavedAt: AT, pauseDraft: "half a thought" });
  });
});

describe("note visibility", () => {
  it("hiding a note survives a save and load, and doesn't delete it", () => {
    const storage = memoryStorage();
    const data = run(
      makeData(),
      { type: "openStep", n: 3 },
      { type: "finishForNow", n: 3, noteText: "Keep me", at: AT },
      { type: "setNoteHidden", n: 3, hidden: true },
    );
    expect(save(data, storage)).toBe(true);
    const loaded = load(storage).data!;
    expect(step(loaded, 3)).toMatchObject({ note: "Keep me", noteHidden: true });
  });

  it("is per step", () => {
    const data = run(makeData(), { type: "setNoteHidden", n: 2, hidden: true });
    expect(step(data, 2).noteHidden).toBe(true);
    expect(step(data, 3).noteHidden).toBe(false);
  });
});

describe("final checks and new assignments", () => {
  it("toggles and keeps ticks", () => {
    const data = run(makeData(), { type: "toggleFinalCheck", requirementId: "r1" }, { type: "toggleFinalCheck", requirementId: "r2" });
    expect(active(data).finalChecks).toEqual({ r1: true, r2: true });
    expect(active(reducer(data, { type: "toggleFinalCheck", requirementId: "r1" })).finalChecks.r1).toBe(false);
  });

  it("startNewAssignment keeps the completed record and leads to brief entry", () => {
    const done = run(makeData(2), { type: "completeStep", n: 1 }, { type: "completeStep", n: 2 }, { type: "finishReview", at: AT });
    const data = reducer(done, { type: "startNewAssignment" });
    expect(data.assignments.map((a) => [a.id, a.status])).toEqual([["a1", "completed"]]);
    // No open assignment: "/" shows brief entry.
    expect(data.activeAssignmentId).toBeNull();
  });
});

describe("several assignments (M7)", () => {
  // Three assignments of 1, 3 and 9 steps; a1 is open.
  const several = (): MomentumData => ({
    version: 1,
    activeAssignmentId: "a1",
    assignments: [makeAssignment("a1", 1), makeAssignment("a2", 3), makeAssignment("a3", 9)],
  });
  const byId = (data: MomentumData, id: string) => data.assignments.find((a) => a.id === id)!;

  it("openAssignment opens a different assignment and changes no assignment", () => {
    const before = several();
    const after = reducer(before, { type: "openAssignment", id: "a3" });
    expect(after.activeAssignmentId).toBe("a3");
    expect(after.assignments).toEqual(before.assignments);
  });

  it("openAssignment returns the same object for an unknown id or the one already open", () => {
    const data = several();
    expect(reducer(data, { type: "openAssignment", id: "nope" })).toBe(data);
    expect(reducer(data, { type: "openAssignment", id: "a1" })).toBe(data);
  });

  it("after openAssignment, step actions change only the newly open assignment", () => {
    const before = several();
    const after = run(
      before,
      { type: "openAssignment", id: "a2" },
      { type: "openStep", n: 1 },
      { type: "completeStep", n: 1 },
      { type: "openStep", n: 2 },
      { type: "finishForNow", n: 2, noteText: "halfway", at: AT },
    );
    expect(byId(after, "a2").steps.map((s) => s.status)).toEqual(["done", "inProgress", "upcoming"]);
    expect(byId(after, "a2").steps[1].note).toBe("halfway");
    expect(byId(after, "a1")).toEqual(byId(before, "a1"));
    expect(byId(after, "a3")).toEqual(byId(before, "a3"));
  });

  it("createPlan with others present (one in review, one active) appends and opens the new one, leaving the rest alone", () => {
    const review = makeAssignment("r1", 3, { status: "review" });
    const activeOne = run(
      { version: 1, activeAssignmentId: "a1", assignments: [makeAssignment("a1", 9)] },
      { type: "openStep", n: 1 },
    ).assignments[0];
    const before: MomentumData = { version: 1, activeAssignmentId: "r1", assignments: [review, activeOne] };
    const after = reducer(before, {
      type: "createPlan",
      id: "new",
      plan: createSamplePlan(),
      brief: "another brief",
      deadlineOverride: "",
      at: AT,
    });
    expect(after.assignments.map((a) => a.id)).toEqual(["r1", "a1", "new"]);
    expect(after.activeAssignmentId).toBe("new");
    expect(active(after).status).toBe("review");
    expect(after.assignments.slice(0, 2)).toEqual(before.assignments);
  });
});

describe("plans that don't have six steps", () => {
  it.each([3, 9])("runs the main loop on a %i-step plan", (stepCount) => {
    let data = makeData(stepCount);
    for (let n = 1; n <= stepCount; n++) {
      data = run(data, { type: "openStep", n });
      if (n === 2) data = run(data, { type: "finishForNow", n, noteText: "paused here", at: AT }, { type: "openStep", n });
      data = reducer(data, { type: "completeStep", n });
      expect(countDoneSteps(active(data))).toBe(n);
    }
    expect(allStepsDone(active(data))).toBe(true);
    expect(step(data, 2).note).toBe("paused here");
    data = reducer(data, { type: "finishReview", at: AT });
    expect(active(data).status).toBe("completed");
  });
});

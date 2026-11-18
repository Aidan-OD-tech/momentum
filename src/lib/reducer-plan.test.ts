import { describe, expect, it } from "vitest";
import { createSamplePlan } from "@/data/sample-assignment";
import { clampEstimate, getActiveAssignment, reducer, type Action } from "@/lib/reducer";
import type { MomentumData, PlanStep } from "@/lib/types";

// Brief entry and plan review (M3): createPlan, the review-only edits and startPlan.

const EMPTY: MomentumData = { version: 1, activeAssignmentId: null, assignments: [] };
const run = (data: MomentumData, ...actions: Action[]) => actions.reduce(reducer, data);
const active = (data: MomentumData) => getActiveAssignment(data)!;

function inReview(deadlineOverride = ""): MomentumData {
  const withDraft = reducer(EMPTY, { type: "setBriefDraft", draft: { text: "the brief", deadline: deadlineOverride } });
  return reducer(withDraft, { type: "createPlan", id: "p1", plan: createSamplePlan(), brief: "the brief", deadlineOverride, at: "2026-11-17T09:00:00.000Z" });
}

const extraStep = (id: string): PlanStep => ({ id, title: `Extra ${id}`, whatToDo: [], doneWhen: "It exists.", estimateMin: 15 });

describe("setBriefDraft", () => {
  it("stores the draft, and treats no draft as an empty one", () => {
    expect(reducer(EMPTY, { type: "setBriefDraft", draft: { text: "", deadline: "" } })).toBe(EMPTY);
    const data = reducer(EMPTY, { type: "setBriefDraft", draft: { text: "hi", deadline: "" } });
    expect(data.briefDraft).toEqual({ text: "hi", deadline: "" });
  });
});

describe("createPlan", () => {
  it("opens the plan in review, upcoming and without notes, and clears the draft", () => {
    const data = inReview();
    expect(data.briefDraft).toBeUndefined();
    expect(data.activeAssignmentId).toBe("p1");
    expect(active(data)).toMatchObject({ status: "review", brief: "the brief", finalChecks: {}, lastUndo: null });
    expect(active(data).steps.every((s) => s.status === "upcoming" && s.note === "" && !s.noteHidden)).toBe(true);
  });

  it("uses the deadline the student typed over the plan's", () => {
    expect(active(inReview("2026-12-10T09:30")).deadline).toBe("2026-12-10T09:30");
  });

  it("keeps the plan's deadline when the field is blank", () => {
    expect(active(inReview("  ")).deadline).toBe(createSamplePlan().deadline);
  });

  it("keeps earlier assignments", () => {
    const earlier = reducer(inReview(), { type: "startPlan", at: "2026-11-17T09:05:00.000Z" });
    const data = run(
      { ...earlier, activeAssignmentId: null },
      { type: "createPlan", id: "p2", plan: createSamplePlan(), brief: "b", deadlineOverride: "", at: "2026-11-17T09:00:00.000Z" },
    );
    expect(data.assignments.map((a) => a.id)).toEqual(["p1", "p2"]);
  });
});

describe("plan edits in review", () => {
  it("updateStep changes only that step, and keeps its intro", () => {
    const before = inReview();
    const after = reducer(before, {
      type: "updateStep",
      n: 3,
      step: { id: "ignored", title: "New title", whatToDo: ["One"], doneWhen: "Done.", estimateMin: 40 },
    });
    const [b, a] = [active(before).steps, active(after).steps];
    expect(a[2]).toMatchObject({ id: b[2].id, title: "New title", whatToDo: ["One"], doneWhen: "Done.", estimateMin: 40, intro: b[2].intro });
    expect(a.filter((_, i) => i !== 2)).toEqual(b.filter((_, i) => i !== 2));
  });

  it.each([
    [1, 5],
    [5, 5],
    [7, 5],
    [8, 10],
    [33, 35],
    [-20, 5],
  ])("clamps an estimate of %i to %i (steps of 5, at least 5)", (input, expected) => {
    expect(clampEstimate(input)).toBe(expected);
    const data = reducer(inReview(), { type: "updateStep", n: 1, step: { ...extraStep("x"), estimateMin: input } });
    expect(active(data).steps[0].estimateMin).toBe(expected);
  });

  it("addStep appends an upcoming step and leaves the others alone", () => {
    const before = inReview();
    const after = reducer(before, { type: "addStep", step: extraStep("new") });
    expect(active(after).steps.slice(0, -1)).toEqual(active(before).steps);
    expect(active(after).steps.at(-1)).toMatchObject({ id: "new", status: "upcoming", note: "", noteSavedAt: null, noteHidden: false });
  });

  it("deleteStep removes only that step, and never the last one", () => {
    const before = inReview();
    const after = reducer(before, { type: "deleteStep", n: 2 });
    expect(active(after).steps.map((s) => s.id)).toEqual(active(before).steps.filter((_, i) => i !== 1).map((s) => s.id));

    let data = before;
    for (let i = 0; i < 10; i++) data = reducer(data, { type: "deleteStep", n: 1 });
    expect(active(data).steps).toHaveLength(1);
  });

  it("updateRequirements replaces the list and leaves the steps deep-equal", () => {
    const before = inReview();
    const after = reducer(before, { type: "updateRequirements", requirements: [{ id: "n1", label: "New", kind: "substantive" }] });
    expect(active(after).requirements).toEqual([{ id: "n1", label: "New", kind: "substantive" }]);
    expect(active(after).steps).toEqual(active(before).steps);
  });

  it("rejects every edit once the plan has started", () => {
    const started = reducer(inReview(), { type: "startPlan", at: "2026-11-17T09:05:00.000Z" });
    const edits: Action[] = [
      { type: "updateStep", n: 1, step: extraStep("x") },
      { type: "addStep", step: extraStep("x") },
      { type: "deleteStep", n: 1 },
      { type: "updateRequirements", requirements: [] },
      { type: "startPlan", at: "2026-11-17T09:05:00.000Z" },
    ];
    for (const edit of edits) expect(reducer(started, edit)).toBe(started);
  });
});

describe("startPlan", () => {
  it("makes the plan active and opens step 1", () => {
    const data = reducer(inReview(), { type: "startPlan", at: "2026-11-17T09:05:00.000Z" });
    expect(active(data).status).toBe("active");
    expect(active(data).steps.map((s) => s.status)).toEqual(["inProgress", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"]);
  });
});

describe("plans that don't have six steps", () => {
  it("grows to 9 steps, shrinks to 1, then runs step 1 to the final review", () => {
    let data = inReview();
    for (let i = 7; i <= 9; i++) data = reducer(data, { type: "addStep", step: extraStep(`x${i}`) });
    expect(active(data).steps).toHaveLength(9);
    while (active(data).steps.length > 1) data = reducer(data, { type: "deleteStep", n: active(data).steps.length });
    expect(active(data).steps).toHaveLength(1);

    data = run(data, { type: "startPlan", at: "2026-11-17T09:05:00.000Z" }, { type: "completeStep", n: 1 }, { type: "finishReview", at: "2026-11-17T10:00:00.000Z" });
    expect(active(data)).toMatchObject({ status: "completed" });
    expect(active(data).steps[0].status).toBe("done");
  });
});

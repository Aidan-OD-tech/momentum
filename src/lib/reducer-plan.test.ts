import { describe, expect, it } from "vitest";
import { createSamplePlan } from "@/data/sample-assignment";
import { OLD_DRAFT_ID, readBriefDrafts } from "@/lib/brief-drafts";
import { clampEstimate, getActiveAssignment, reducer, type Action } from "@/lib/reducer";
import type { MomentumData, PlanStep } from "@/lib/types";

// Brief entry and plan review (M3): createPlan, the review-only edits and startPlan.

const EMPTY: MomentumData = { version: 1, activeAssignmentId: null, assignments: [] };
const run = (data: MomentumData, ...actions: Action[]) => actions.reduce(reducer, data);
const active = (data: MomentumData) => getActiveAssignment(data)!;

function inReview(deadlineOverride = ""): MomentumData {
  const withDraft = reducer(EMPTY, { type: "setBriefDrafts", drafts: [{ id: "d1", text: "the brief", deadline: deadlineOverride }] });
  return reducer(withDraft, { type: "createPlan", id: "p1", plan: createSamplePlan(), brief: "the brief", deadlineOverride, at: "2026-11-17T09:00:00.000Z" });
}

const extraStep = (id: string): PlanStep => ({ id, title: `Extra ${id}`, whatToDo: [], doneWhen: "It exists.", estimateMin: 15 });

describe("setBriefDrafts (M7c)", () => {
  const OLD: MomentumData = { ...EMPTY, briefDraft: { text: "Old brief", deadline: "2026-12-01T09:00" } };

  it("stores briefs with text or a deadline, and treats no drafts as empty cards", () => {
    expect(reducer(EMPTY, { type: "setBriefDrafts", drafts: [{ id: "a", text: "", deadline: "" }] })).toBe(EMPTY);
    const data = reducer(EMPTY, {
      type: "setBriefDrafts",
      drafts: [
        { id: "a", text: "hi", deadline: "" },
        { id: "b", text: "", deadline: "" },
        { id: "c", text: "", deadline: "2026-12-01T09:00" },
      ],
    });
    expect(data.briefDrafts).toEqual([
      { id: "a", text: "hi", deadline: "" },
      { id: "c", text: "", deadline: "2026-12-01T09:00" },
    ]);
  });

  it("an unchanged list writes nothing, in either stored shape", () => {
    const data = reducer(EMPTY, { type: "setBriefDrafts", drafts: [{ id: "a", text: "hi", deadline: "" }] });
    expect(reducer(data, { type: "setBriefDrafts", drafts: [{ id: "a", text: "hi", deadline: "" }] })).toBe(data);
    expect(reducer(OLD, { type: "setBriefDrafts", drafts: readBriefDrafts(OLD) })).toBe(OLD);
  });

  it("the first change to an old draft stores briefDrafts and drops briefDraft", () => {
    const [old] = readBriefDrafts(OLD);
    const data = reducer(OLD, { type: "setBriefDrafts", drafts: [{ ...old, text: "Old brief, edited" }, { id: "n", text: "New", deadline: "" }] });
    expect(data.briefDraft).toBeUndefined();
    expect(data.briefDrafts).toEqual([
      { id: OLD_DRAFT_ID, text: "Old brief, edited", deadline: "2026-12-01T09:00" },
      { id: "n", text: "New", deadline: "" },
    ]);
  });

  it("clearing every brief leaves no drafts at all", () => {
    const data = reducer(OLD, { type: "setBriefDrafts", drafts: [] });
    expect(data.briefDraft).toBeUndefined();
    expect(data.briefDrafts).toBeUndefined();
  });
});

describe("readBriefDrafts (M7c)", () => {
  it("reads the new shape, the old one as one item, and nothing as none", () => {
    expect(readBriefDrafts({ ...EMPTY, briefDrafts: [{ id: "x", text: "t", deadline: "" }] })).toEqual([{ id: "x", text: "t", deadline: "" }]);
    expect(readBriefDrafts({ ...EMPTY, briefDraft: { text: "t", deadline: "d" } })).toEqual([{ id: OLD_DRAFT_ID, text: "t", deadline: "d" }]);
    expect(readBriefDrafts(EMPTY)).toEqual([]);
  });

  it("prefers briefDrafts when both are present", () => {
    const both = { ...EMPTY, briefDraft: { text: "old", deadline: "" }, briefDrafts: [{ id: "x", text: "new", deadline: "" }] };
    expect(readBriefDrafts(both).map((d) => d.text)).toEqual(["new"]);
  });
});

describe("addPlanFromDraft (M7c)", () => {
  const plan = createSamplePlan();
  const drafts = [
    { id: "d1", text: "First brief", deadline: "" },
    { id: "d2", text: "Second brief", deadline: "2026-12-10T09:30" },
  ];
  const start = (): MomentumData => reducer({ ...EMPTY, activeAssignmentId: null }, { type: "setBriefDrafts", drafts });
  const add = (data: MomentumData, draftId: string, id: string, deadlineOverride = "") =>
    reducer(data, { type: "addPlanFromDraft", draftId, id, plan, brief: `brief ${id}`, deadlineOverride, at: "2026-11-18T09:00:00.000Z" });

  it("adds the plan in review, built as createPlan builds it, and removes only its own draft", () => {
    const data = add(start(), "d2", "p2", "2026-12-10T09:30");
    const created = reducer(EMPTY, { type: "createPlan", id: "p2", plan, brief: "brief p2", deadlineOverride: "2026-12-10T09:30", at: "2026-11-18T09:00:00.000Z" });
    expect(data.assignments).toEqual(created.assignments);
    expect(data.briefDrafts).toEqual([drafts[0]]);
  });

  it("doesn't change which assignment is open", () => {
    const open = { ...start(), activeAssignmentId: "x" };
    expect(add(open, "d1", "p1").activeAssignmentId).toBe("x");
    expect(add(start(), "d1", "p1").activeAssignmentId).toBeNull();
  });

  it("removes an old-shape draft by its read id", () => {
    const old: MomentumData = { ...EMPTY, briefDraft: { text: "Old", deadline: "" } };
    const data = add(old, OLD_DRAFT_ID, "p1");
    expect(data.briefDraft).toBeUndefined();
    expect(data.briefDrafts).toBeUndefined();
    expect(data.assignments).toHaveLength(1);
  });
});

describe("createPlan", () => {
  it("opens the plan in review, upcoming and without notes, and clears the draft", () => {
    const data = inReview();
    expect(data.briefDraft).toBeUndefined();
    expect(data.briefDrafts).toBeUndefined();
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

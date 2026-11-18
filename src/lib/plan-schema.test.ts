import { describe, expect, it } from "vitest";
import { modelPlan } from "@/test/model-plan";
import { cleanDeadline, ModelPlanSchema, PlanRequestSchema, roundEstimate, toPlanDraft } from "@/lib/plan-schema";

const step = (n: number) => ({ title: `Step ${n}`, intro: null, whatToDo: ["Do it"], doneWhen: "Done.", estimateMin: 10 });

describe("toPlanDraft", () => {
  it("adds IDs, trims text, sorts substantive first and keeps the submission reminder", () => {
    const plan = toPlanDraft(modelPlan())!;
    expect(plan.title).toBe("Lab report");
    expect(plan.requirements.map((r) => [r.id, r.kind])).toEqual([
      ["r1", "substantive"],
      ["r2", "format"],
      ["r3", "submission"],
    ]);
    expect(plan.requirements[0].shortLabel).toBeUndefined();
    expect(plan.steps.map((s) => s.id)).toEqual(["s1", "s2"]);
    expect(plan.steps[0].whatToDo).toEqual(["Read it once"]);
    expect(plan.steps[0].intro).toBeUndefined();
  });

  it("rounds estimates to the nearest 5 minutes, at least 5", () => {
    const plan = toPlanDraft(modelPlan())!;
    expect(plan.steps.map((s) => s.estimateMin)).toEqual([5, 5]);
    expect([roundEstimate(7), roundEstimate(8), roundEstimate(42), roundEstimate(0), roundEstimate(-3), roundEstimate(NaN)]).toEqual([
      5, 10, 40, 5, 5, 5,
    ]);
  });

  it("accepts 1 to 12 steps", () => {
    expect(toPlanDraft(modelPlan({ steps: [step(1)] }))?.steps).toHaveLength(1);
    expect(toPlanDraft(modelPlan({ steps: Array.from({ length: 12 }, (_, i) => step(i + 1)) }))?.steps).toHaveLength(12);
    expect(toPlanDraft(modelPlan({ steps: [] }))).toBeNull();
    expect(toPlanDraft(modelPlan({ steps: Array.from({ length: 13 }, (_, i) => step(i + 1)) }))).toBeNull();
  });

  it("is null when the model says the text isn't readable", () => {
    expect(toPlanDraft(modelPlan({ readable: false }))).toBeNull();
  });

  it("is null with no substantive or format requirements (a submission reminder alone isn't enough)", () => {
    expect(toPlanDraft(modelPlan({ requirements: [] }))).toBeNull();
    expect(toPlanDraft(modelPlan({ requirements: [{ label: "Submit on Canvas", shortLabel: null, kind: "submission" }] }))).toBeNull();
  });

  it("is null when a step has no title or Done when", () => {
    expect(toPlanDraft(modelPlan({ steps: [{ ...step(1), doneWhen: " " }] }))).toBeNull();
    expect(toPlanDraft(modelPlan({ steps: [{ ...step(1), title: "" }] }))).toBeNull();
  });

  it("keeps a date-only deadline and drops a malformed one instead of rejecting the plan", () => {
    expect(toPlanDraft(modelPlan({ deadline: "2026-12-04" }))?.deadline).toBe("2026-12-04");
    expect(toPlanDraft(modelPlan({ deadline: "Friday" }))?.deadline).toBeUndefined();
    expect(toPlanDraft(modelPlan({ deadline: null }))?.deadline).toBeUndefined();
  });
});

describe("cleanDeadline", () => {
  it("accepts real dates with or without a time", () => {
    expect(cleanDeadline("2026-12-04T17:00")).toBe("2026-12-04T17:00");
    expect(cleanDeadline("2026-12-04")).toBe("2026-12-04");
  });

  it("rejects impossible or differently shaped dates", () => {
    for (const bad of ["2026-02-30", "2026-12-04T24:00", "2026-12-04T17:00:00", "12/04/2026", "", null]) {
      expect(cleanDeadline(bad)).toBeUndefined();
    }
  });
});

describe("schemas", () => {
  it("the request takes a brief and an optional deadline, nothing else", () => {
    expect(PlanRequestSchema.safeParse({ brief: "x" }).success).toBe(true);
    expect(PlanRequestSchema.safeParse({ brief: "x", deadline: "2026-12-04T17:00" }).success).toBe(true);
    expect(PlanRequestSchema.safeParse({ brief: 3 }).success).toBe(false);
    expect(PlanRequestSchema.safeParse({ brief: "x", extra: true }).success).toBe(false);
    expect(PlanRequestSchema.safeParse(null).success).toBe(false);
  });

  it("the model schema needs every field (nullable, never optional)", () => {
    expect(ModelPlanSchema.safeParse(modelPlan()).success).toBe(true);
    const withoutCourse: Record<string, unknown> = { ...modelPlan() };
    delete withoutCourse.course;
    expect(ModelPlanSchema.safeParse(withoutCourse).success).toBe(false);
  });
});

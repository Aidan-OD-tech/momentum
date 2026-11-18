import type { ModelPlan } from "@/lib/plan-schema";

// A model reply in the shape the schema asks for. Development data, not real model output.
export function modelPlan(overrides: Partial<ModelPlan> = {}): ModelPlan {
  return {
    readable: true,
    title: " Lab report ",
    course: "BIO 210",
    summary: "Report on an enzyme experiment.",
    deadline: "2026-12-04T17:00",
    requirements: [
      { label: "Submit on Canvas", shortLabel: null, kind: "submission" },
      { label: "Between 1,000 and 1,500 words", shortLabel: "1,500 words", kind: "format" },
      { label: "Explains how temperature affects the reaction rate", shortLabel: null, kind: "substantive" },
    ],
    steps: [
      { title: "Read the brief", intro: null, whatToDo: ["Read it once", "  "], doneWhen: "You can say what is asked.", estimateMin: 7 },
      { title: "Plan the report", intro: "Sketch the sections.", whatToDo: ["List the sections"], doneWhen: "You have a list.", estimateMin: 2 },
    ],
    ...overrides,
  };
}

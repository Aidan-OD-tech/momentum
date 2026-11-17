import { describe, expect, it } from "vitest";
import { applyRequirementRows, stepFromDraft, validateStep } from "@/lib/plan-edits";
import type { Requirement } from "@/lib/types";

const original: Requirement[] = [
  { id: "r1", label: "Takes a clear position", kind: "substantive" },
  { id: "r2", label: "Between 1,350 and 1,650 words", kind: "format", shortLabel: "1,500 words" },
  { id: "r3", label: "APA 7th", kind: "format", shortLabel: "APA 7th" },
];

describe("applyRequirementRows", () => {
  it("keeps unchanged rows exactly, including shortLabel", () => {
    const rows = original.map((r) => ({ id: r.id, label: r.label }));
    expect(applyRequirementRows(original, rows, () => "new")).toEqual(original);
  });

  it("clears shortLabel on a changed label, adds new rows as substantive, drops empty and removed rows", () => {
    const rows = [
      { id: "r2", label: "  Between 1,400 and 1,600 words " },
      { id: "r3", label: "   " },
      { id: null, label: "Include one counterargument" },
      { id: null, label: "" },
    ];
    expect(applyRequirementRows(original, rows, () => "n1")).toEqual([
      { id: "r2", label: "Between 1,400 and 1,600 words", kind: "format" },
      { id: "n1", label: "Include one counterargument", kind: "substantive" },
    ]);
  });
});

describe("step drafts", () => {
  it("needs a title and a Done when", () => {
    expect(validateStep({ title: " ", whatToDo: [], doneWhen: "", estimateMin: 15 })).toEqual({
      title: "Add a title.",
      doneWhen: "Add a Done when.",
    });
    expect(validateStep({ title: "T", whatToDo: [], doneWhen: "D", estimateMin: 15 })).toEqual({});
  });

  it("trims text and drops empty What to do items", () => {
    expect(stepFromDraft("s9", { title: " T ", whatToDo: ["a ", " ", "b"], doneWhen: " D ", estimateMin: 20 })).toEqual({
      id: "s9",
      title: "T",
      whatToDo: ["a", "b"],
      doneWhen: "D",
      estimateMin: 20,
    });
  });
});

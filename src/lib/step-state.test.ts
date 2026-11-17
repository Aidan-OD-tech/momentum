import { describe, expect, it } from "vitest";
import { reducer } from "@/lib/reducer";
import { inProgressStepNumber, nextStepNumber, parseStepParam, substantiveFirst } from "@/lib/step-state";
import { makeData } from "@/test/fixtures";

describe("parseStepParam", () => {
  it("accepts plain positive whole numbers, with no upper limit from the sample plan", () => {
    expect(parseStepParam("1")).toBe(1);
    expect(parseStepParam("9")).toBe(9);
  });

  it.each(["0", "-1", "abc", "", "03", "1.5", "1e1", " 3"])("rejects %j", (param) => {
    expect(parseStepParam(param)).toBeNull();
  });
});

describe("step lookups", () => {
  it("home resumes the lowest-numbered step in progress", () => {
    let data = makeData(6);
    data = reducer(data, { type: "openStep", n: 5 });
    data = reducer(data, { type: "openStep", n: 2 });
    expect(inProgressStepNumber(data.assignments[0])).toBe(2);
  });

  it("next step looks after the given step first, then from the start", () => {
    let data = makeData(4);
    for (const n of [1, 3]) data = reducer(data, { type: "completeStep", n });
    expect(nextStepNumber(data.assignments[0], 3)).toBe(4);
    data = reducer(data, { type: "completeStep", n: 4 });
    expect(nextStepNumber(data.assignments[0], 4)).toBe(2);
    data = reducer(data, { type: "completeStep", n: 2 });
    expect(nextStepNumber(data.assignments[0], 2)).toBeNull();
  });

  it("orders requirements substantive first", () => {
    const ordered = substantiveFirst([
      { id: "a", kind: "submission", label: "" },
      { id: "b", kind: "format", label: "" },
      { id: "c", kind: "substantive", label: "" },
    ]);
    expect(ordered.map((r) => r.id)).toEqual(["c", "b", "a"]);
  });
});

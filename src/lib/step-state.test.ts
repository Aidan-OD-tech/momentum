import { describe, expect, it } from "vitest";
import { getStepDisplayStates, parseStepNumber } from "@/lib/step-state";

describe("getStepDisplayStates", () => {
  it("n = 1: first step current, the rest upcoming", () => {
    expect(getStepDisplayStates(6, 1)).toEqual(["current", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"]);
  });

  it("n = 3: two done, step 3 current, three upcoming", () => {
    expect(getStepDisplayStates(6, 3)).toEqual(["done", "done", "current", "upcoming", "upcoming", "upcoming"]);
  });

  it("n = last: all earlier steps done", () => {
    expect(getStepDisplayStates(6, 6)).toEqual(["done", "done", "done", "done", "done", "current"]);
  });

  it("works for plans that don't have six steps", () => {
    expect(getStepDisplayStates(4, 4)).toEqual(["done", "done", "done", "current"]);
    expect(getStepDisplayStates(9, 2).filter((state) => state === "done")).toHaveLength(1);
  });
});

describe("parseStepNumber", () => {
  it("accepts whole numbers from 1 to the step count", () => {
    expect(parseStepNumber("1", 6)).toBe(1);
    expect(parseStepNumber("6", 6)).toBe(6);
  });

  it.each(["0", "7", "-1", "abc", "", "03", "3.5", "1e1", " 3"])("rejects %j", (param) => {
    expect(parseStepNumber(param, 6)).toBeNull();
  });
});

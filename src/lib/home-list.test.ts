import { describe, expect, it } from "vitest";
import { currentStatusLine, finishedStatusLine, openPath } from "@/lib/home-list";
import type { Assignment, StepStatus } from "@/lib/types";
import { HOME_LIST_NOW, makeAssignment, mixedHomeList } from "@/test/fixtures";

const byId = (id: string) => mixedHomeList().assignments.find((a) => a.id === id)!;

// Steps of 30 min with the given statuses.
function withStatuses(statuses: StepStatus[], overrides: Partial<Assignment> = {}): Assignment {
  const assignment = makeAssignment("a", statuses.length, overrides);
  return { ...assignment, steps: assignment.steps.map((step, i) => ({ ...step, status: statuses[i], estimateMin: 30 })) };
}

describe("currentStatusLine", () => {
  it("review: plan ready with the step count and total time", () => {
    expect(currentStatusLine(byId("problems"), HOME_LIST_NOW)).toBe("Plan ready · 9 steps · About 4 h 30 min");
    expect(currentStatusLine(withStatuses(["upcoming"], { status: "review" }))).toBe("Plan ready · 1 step · About 30 min");
  });

  it("nothing started", () => {
    expect(currentStatusLine(byId("reading"), HOME_LIST_NOW)).toBe("Not started · 1 step · About 30 min");
    expect(currentStatusLine(withStatuses(["upcoming", "upcoming", "upcoming"]))).toBe("Not started · 3 steps · About 1 h 30 min");
  });

  it("paused, with the note's day when the step has a note", () => {
    expect(currentStatusLine(byId("lab"), HOME_LIST_NOW)).toBe(
      "Paused at step 2 · 1 of 3 steps done · About 1 h of steps left · note saved yesterday",
    );
    expect(currentStatusLine(withStatuses(["inProgress"]))).toBe("Paused at step 1 · 0 of 1 step done · About 30 min of steps left");
  });

  it("between steps", () => {
    expect(currentStatusLine(byId("portfolio"), HOME_LIST_NOW)).toBe("4 of 9 steps done · About 2 h 30 min of steps left");
  });

  it("all steps done", () => {
    expect(currentStatusLine(byId("essay"), HOME_LIST_NOW)).toBe("All steps done · Final check next");
    expect(currentStatusLine(withStatuses(["done"]))).toBe("All steps done · Final check next");
  });
});

describe("finishedStatusLine", () => {
  it("names the day the final check was reviewed, or just all steps done", () => {
    expect(finishedStatusLine(byId("bibliography"))).toBe("Final check reviewed Nov 10");
    expect(finishedStatusLine(byId("quiz"))).toBe("All steps done");
  });
});

describe("openPath", () => {
  it("goes to the plan, the step in progress, the next step or the final check", () => {
    expect(openPath(byId("problems"))).toBe("/plan");
    expect(openPath(byId("lab"))).toBe("/step/2");
    expect(openPath(byId("portfolio"))).toBe("/step/5");
    expect(openPath(byId("reading"))).toBe("/step/1");
    expect(openPath(byId("essay"))).toBe("/final");
    expect(openPath(withStatuses(["done", "upcoming", "done", "inProgress", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"]))).toBe("/step/4");
  });
});

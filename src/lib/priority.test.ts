import { describe, expect, it } from "vitest";
import { currentAssignments, finishedAssignments, remainingMinutes } from "@/lib/priority";
import type { Assignment, StepStatus } from "@/lib/types";
import { makeAssignment } from "@/test/fixtures";

// An assignment whose steps have the given estimates and statuses (all upcoming by default).
function withSteps(id: string, estimates: number[], statuses: StepStatus[] = [], overrides: Partial<Assignment> = {}): Assignment {
  const assignment = makeAssignment(id, estimates.length, overrides);
  const steps = assignment.steps.map((step, index) => ({ ...step, estimateMin: estimates[index], status: statuses[index] ?? "upcoming" }));
  return { ...assignment, steps };
}

// A 3-step assignment with no deadline and no planCreatedAt unless given.
function make(id: string, overrides: Partial<Assignment> = {}): Assignment {
  return makeAssignment(id, 3, { deadline: undefined, planCreatedAt: undefined, ...overrides });
}

const ids = (assignments: Assignment[]) => assignments.map((a) => a.id);

describe("remainingMinutes", () => {
  it("counts every step when all are upcoming", () => {
    expect(remainingMinutes(withSteps("a", [10, 20, 30]))).toBe(60);
  });

  it("leaves out done steps", () => {
    expect(remainingMinutes(withSteps("a", [10, 20, 30], ["done", "upcoming", "upcoming"]))).toBe(50);
  });

  it("counts a step in progress in full", () => {
    expect(remainingMinutes(withSteps("a", [10, 20, 30], ["done", "inProgress", "upcoming"]))).toBe(50);
  });

  it("is 0 when every step is done", () => {
    expect(remainingMinutes(withSteps("a", [10, 20, 30], ["done", "done", "done"]))).toBe(0);
  });

  it("doesn't assume a step count: 1, 3 and 9 steps", () => {
    expect(remainingMinutes(withSteps("a", [25]))).toBe(25);
    expect(remainingMinutes(withSteps("a", [5, 5, 5], ["done"]))).toBe(10);
    expect(remainingMinutes(withSteps("a", Array(9).fill(15), ["done", "done", "inProgress"]))).toBe(105);
  });
});

describe("currentAssignments order", () => {
  it("rule 1: assignments with a deadline come before those without", () => {
    const undated = make("undated", { planCreatedAt: "2026-11-01T09:00:00.000Z" });
    const dated = make("dated", { deadline: "2026-12-20T09:00" });
    expect(ids(currentAssignments([undated, dated]))).toEqual(["dated", "undated"]);
  });

  it("rule 2: earliest deadline first", () => {
    const later = make("later", { deadline: "2026-12-10T09:00" });
    const sooner = make("sooner", { deadline: "2026-12-04T17:00" });
    const latest = make("latest", { deadline: "2027-01-02" });
    expect(ids(currentAssignments([later, latest, sooner]))).toEqual(["sooner", "later", "latest"]);
  });

  it("rule 2: a passed deadline simply sorts first", () => {
    const upcoming = make("upcoming", { deadline: "2026-12-04T17:00" });
    const passed = make("passed", { deadline: "2026-11-01T17:00" });
    expect(ids(currentAssignments([upcoming, passed]))).toEqual(["passed", "upcoming"]);
  });

  it("rule 2: a date-only deadline counts as 23:59, so 17:00 the same day comes first", () => {
    const dateOnly = make("dateOnly", { deadline: "2026-12-04" });
    const atFive = make("atFive", { deadline: "2026-12-04T17:00" });
    const nextMorning = make("nextMorning", { deadline: "2026-12-05T00:00" });
    expect(ids(currentAssignments([nextMorning, dateOnly, atFive]))).toEqual(["atFive", "dateOnly", "nextMorning"]);
  });

  it("rule 2: a date-only deadline ties with 23:59 the same day (then rule 3 decides)", () => {
    const dateOnly = withSteps("dateOnly", [10], [], { deadline: "2026-12-04" });
    const lateNight = withSteps("lateNight", [40], [], { deadline: "2026-12-04T23:59" });
    expect(ids(currentAssignments([dateOnly, lateNight]))).toEqual(["lateNight", "dateOnly"]);
  });

  it("rule 2: an invalid deadline counts as no deadline", () => {
    const invalid = make("invalid", { deadline: "2026-02-30T17:00", planCreatedAt: "2026-11-01T09:00:00.000Z" });
    const garbage = make("garbage", { deadline: "next Friday", planCreatedAt: "2026-11-02T09:00:00.000Z" });
    const badTime = make("badTime", { deadline: "2026-12-04T25:00", planCreatedAt: "2026-11-03T09:00:00.000Z" });
    const dated = make("dated", { deadline: "2027-06-01T09:00" });
    expect(ids(currentAssignments([invalid, garbage, badTime, dated]))).toEqual(["dated", "invalid", "garbage", "badTime"]);
  });

  it("rule 3: same deadline, more remaining minutes first", () => {
    const deadline = "2026-12-04T17:00";
    // 1 step of 20 min; 3 steps with 30 min left; 9 steps with 90 min left.
    const small = withSteps("small", [20], [], { deadline });
    const medium = withSteps("medium", [30, 15, 15], ["done", "inProgress"], { deadline });
    const large = withSteps("large", Array(9).fill(15), ["done", "done", "done"], { deadline });
    expect(ids(currentAssignments([small, medium, large]))).toEqual(["large", "medium", "small"]);
  });

  it("rule 4: undated, earlier planCreatedAt first", () => {
    const newer = make("newer", { planCreatedAt: "2026-11-15T09:00:00.000Z" });
    const older = make("older", { planCreatedAt: "2026-11-10T09:00:00.000Z" });
    expect(ids(currentAssignments([newer, older]))).toEqual(["older", "newer"]);
  });

  it("rule 4: undated with no planCreatedAt (pre-M5 data) go after those that have it", () => {
    const preM5 = make("preM5");
    const withDate = make("withDate", { planCreatedAt: "2026-11-15T09:00:00.000Z" });
    expect(ids(currentAssignments([preM5, withDate]))).toEqual(["withDate", "preM5"]);
  });

  it("rule 5: anything still tied keeps its array order", () => {
    const deadline = "2026-12-04T17:00";
    const tiedDated = ["d1", "d2", "d3"].map((id) => withSteps(id, [10, 10, 10], [], { deadline }));
    const tiedUndated = ["u1", "u2"].map((id) => make(id));
    const createdSame = ["c1", "c2"].map((id) => make(id, { planCreatedAt: "2026-11-15T09:00:00.000Z" }));
    expect(ids(currentAssignments([tiedUndated[0], createdSame[0], tiedDated[0], tiedUndated[1], tiedDated[1], createdSame[1], tiedDated[2]])))
      .toEqual(["d1", "d2", "d3", "c1", "c2", "u1", "u2"]);
  });

  it("puts all the rules together", () => {
    const list = [
      make("undatedPreM5"),
      make("undatedNew", { planCreatedAt: "2026-11-17T09:00:00.000Z" }),
      withSteps("dueDecSmall", [10], [], { deadline: "2026-12-04T17:00" }),
      make("undatedOld", { planCreatedAt: "2026-11-01T09:00:00.000Z" }),
      withSteps("dueDecBig", Array(9).fill(20), [], { deadline: "2026-12-04T17:00" }),
      make("dueNov", { deadline: "2026-11-20" }),
    ];
    expect(ids(currentAssignments(list))).toEqual(["dueNov", "dueDecBig", "dueDecSmall", "undatedOld", "undatedNew", "undatedPreM5"]);
  });

  it("does not change the array it is given", () => {
    const list = [make("b", { deadline: "2026-12-10" }), make("a", { deadline: "2026-12-01" })];
    currentAssignments(list);
    expect(ids(list)).toEqual(["b", "a"]);
  });
});

describe("current and finished", () => {
  const review = make("review", { status: "review", deadline: "2026-12-10T09:00" });
  const active = make("active", { status: "active", deadline: "2026-12-01T09:00" });
  const doneOld = make("doneOld", { status: "completed", completedAt: "2026-11-01T09:00:00.000Z" });
  const doneNew = make("doneNew", { status: "completed", completedAt: "2026-11-16T09:00:00.000Z" });
  const all = [doneOld, review, doneNew, active];

  it("currentAssignments keeps review and active, and leaves out completed", () => {
    expect(ids(currentAssignments(all))).toEqual(["active", "review"]);
  });

  it("finishedAssignments is completed only, newest completedAt first", () => {
    expect(ids(finishedAssignments(all))).toEqual(["doneNew", "doneOld"]);
  });

  it("both are empty for an empty list", () => {
    expect(currentAssignments([])).toEqual([]);
    expect(finishedAssignments([])).toEqual([]);
  });
});

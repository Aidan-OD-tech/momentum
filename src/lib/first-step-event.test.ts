import { afterEach, describe, expect, it, vi } from "vitest";
import { createSamplePlan } from "@/data/sample-assignment";
import { firstStepStartedEvent, minuteBucket, sendEvent } from "@/lib/first-step-event";
import { getActiveAssignment, reducer, type Action } from "@/lib/reducer";
import type { MomentumData } from "@/lib/types";

const EMPTY: MomentumData = { version: 1, activeAssignmentId: null, assignments: [] };
const CREATED = "2026-11-18T10:00:00.000Z";
const run = (data: MomentumData, ...actions: Action[]) => actions.reduce(reducer, data);
const active = (data: MomentumData) => getActiveAssignment(data)!;
const inReview = () => reducer(EMPTY, { type: "createPlan", id: "p1", plan: createSamplePlan(), brief: "Secret brief text", deadlineOverride: "", at: CREATED });
const minutesLater = (minutes: number) => new Date(Date.parse(CREATED) + minutes * 60_000).toISOString();

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("minuteBucket", () => {
  it.each([
    [0, "<2"],
    [1.99, "<2"],
    [2, "2–5"],
    [4.99, "2–5"],
    [5, "5–15"],
    [14.99, "5–15"],
    [15, ">15"],
    [600, ">15"],
  ])("%s minutes is %s", (minutes, bucket) => {
    expect(minuteBucket(minutes)).toBe(bucket);
  });
});

describe("firstStepStartedEvent", () => {
  it("has the bucket and the plan's step count, and nothing else", () => {
    const event = firstStepStartedEvent(active(inReview()), minutesLater(3));
    expect(event).toEqual({ event: "first_step_started", minutesSincePlanCreated: "2–5", stepCount: 6 });
    // No text from the brief or plan, and no ids: only the two allowed properties and the name.
    expect(Object.keys(event!).sort()).toEqual(["event", "minutesSincePlanCreated", "stepCount"]);
    expect(JSON.stringify(event)).not.toMatch(/Secret|p1|s1|Urban/);
  });

  it("counts the steps of this plan, not six", () => {
    const data = inReview();
    const three = run(data, { type: "deleteStep", n: 6 }, { type: "deleteStep", n: 5 }, { type: "deleteStep", n: 4 });
    expect(firstStepStartedEvent(active(three), minutesLater(1))?.stepCount).toBe(3);
  });

  it("is null once step 1 has been started, so a reload, an undo or reopening step 1 sends nothing", () => {
    let data = run(inReview(), { type: "startPlan", at: minutesLater(3) });
    expect(active(data).firstStepStartedAt).toBe(minutesLater(3));
    expect(firstStepStartedEvent(active(data), minutesLater(4))).toBeNull();

    // Complete step 1, undo it, open it again: the first start time stays and no event is due.
    data = run(data, { type: "completeStep", n: 1 }, { type: "undo" }, { type: "openStep", n: 1 });
    expect(active(data).firstStepStartedAt).toBe(minutesLater(3));
    expect(firstStepStartedEvent(active(data), minutesLater(20))).toBeNull();

    // A reload reads the same data back from storage.
    const reloaded = JSON.parse(JSON.stringify(data)) as MomentumData;
    expect(firstStepStartedEvent(active(reloaded), minutesLater(30))).toBeNull();
  });

  it("is null for a plan saved before M5, which has no creation time", () => {
    const { planCreatedAt, ...old } = active(inReview());
    expect(planCreatedAt).toBe(CREATED);
    expect(firstStepStartedEvent(old, minutesLater(1))).toBeNull();
  });
});

describe("sendEvent", () => {
  const event = { event: "first_step_started", minutesSincePlanCreated: "<2", stepCount: 4 } as const;

  it.each(["development", "test", undefined])("sends nothing when NODE_ENV is %s", (env) => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal("fetch", fetchSpy);
    expect(sendEvent(event, env)).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends nothing in the test run itself (default NODE_ENV)", () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal("fetch", fetchSpy);
    expect(sendEvent(event)).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("in production, posts exactly the event to /api/event and ignores a failure", async () => {
    const fetchSpy = vi.fn<typeof fetch>(() => Promise.reject(new TypeError("offline")));
    vi.stubGlobal("fetch", fetchSpy);
    expect(sendEvent(event, "production")).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/event");
    expect(init!.method).toBe("POST");
    expect(JSON.parse(init!.body as string)).toEqual(event);
    // The rejected request must not surface as an unhandled error.
    await Promise.resolve();
  });
});

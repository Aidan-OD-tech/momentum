import { afterEach, describe, expect, it, vi } from "vitest";
import { createSamplePlan } from "@/data/sample-assignment";
import { apiPlanSource, simulatedSource } from "@/lib/plan-source";

afterEach(() => vi.unstubAllGlobals());

// Replaces fetch with one that answers `status` and `body`, or throws, and records the call.
function mockFetch(answer: { status: number; body?: unknown } | Error) {
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    if (answer instanceof Error) throw answer;
    init.signal?.throwIfAborted();
    return new Response(JSON.stringify(answer.body ?? {}), { status: answer.status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const build = (signal = new AbortController().signal) => apiPlanSource.build({ brief: "A brief", deadline: "2026-12-04T17:00" }, signal);

describe("apiPlanSource", () => {
  it("posts the brief and deadline to /api/plan with the build signal", async () => {
    const fetchMock = mockFetch({ status: 200, body: { ok: true, plan: createSamplePlan() } });
    const controller = new AbortController();
    await build(controller.signal);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/plan");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ brief: "A brief", deadline: "2026-12-04T17:00" });
    expect(init.signal).toBe(controller.signal);
  });

  it("200 is a plan", async () => {
    mockFetch({ status: 200, body: { ok: true, plan: createSamplePlan() } });
    expect(await build()).toEqual({ ok: true, plan: createSamplePlan() });
  });

  it("422 is unreadable (Error 02)", async () => {
    mockFetch({ status: 422, body: { reason: "unreadable" } });
    expect(await build()).toEqual({ ok: false, reason: "unreadable" });
  });

  it.each([400, 413, 429, 500, 502, 504])("%i is failed (Error 03)", async (status) => {
    mockFetch({ status, body: { reason: "failed" } });
    expect(await build()).toEqual({ ok: false, reason: "failed" });
  });

  it("a network error is failed", async () => {
    mockFetch(new TypeError("Failed to fetch"));
    expect(await build()).toEqual({ ok: false, reason: "failed" });
  });

  it("an aborted request (Cancel) is failed", async () => {
    mockFetch({ status: 200, body: { ok: true, plan: createSamplePlan() } });
    const controller = new AbortController();
    controller.abort();
    expect(await build(controller.signal)).toEqual({ ok: false, reason: "failed" });
  });
});

describe("simulatedSource (?simulate=)", () => {
  it.each(["unreadable", "failed"] as const)("in development, %s returns that result", async (mode) => {
    const source = simulatedSource(`?simulate=${mode}`, "development");
    expect(await source!.build({ brief: "x" }, new AbortController().signal)).toEqual({ ok: false, reason: mode });
  });

  it("in development, slow waits until the build is cancelled", async () => {
    const controller = new AbortController();
    const result = simulatedSource("?simulate=slow", "development")!.build({ brief: "x" }, controller.signal);
    controller.abort();
    expect(await result).toEqual({ ok: false, reason: "failed" });
  });

  it.each(["production", "test", undefined])("is ignored when NODE_ENV is %s", (env) => {
    expect(simulatedSource("?simulate=failed", env)).toBeNull();
  });

  it("is ignored without the parameter or with an unknown value", () => {
    expect(simulatedSource("", "development")).toBeNull();
    expect(simulatedSource("?simulate=boom", "development")).toBeNull();
  });
});

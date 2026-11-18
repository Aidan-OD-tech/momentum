// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_EVENT_BODY_CHARS, POST } from "@/app/api/event/route";
import { EVENT_PER_IP_LIMIT, resetEventRateLimit } from "@/lib/server/rate-limit";

const IP = "203.0.113.7";
const valid = { event: "first_step_started", minutesSincePlanCreated: "2–5", stepCount: 6 };

function post(body: unknown, ip = IP) {
  return POST(
    new Request("http://localhost/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `${ip}, 10.0.0.1` },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

let logs: string[];
beforeEach(() => {
  resetEventRateLimit();
  logs = [];
  vi.spyOn(console, "info").mockImplementation((...args) => void logs.push(args.join(" ")));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("POST /api/event", () => {
  it("accepts the event and logs one line with only the allowed fields and the Vercel environment", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const response = await post(valid);
    expect(response.status).toBe(204);
    expect(logs).toEqual(["[api/event] event=first_step_started stepCount=6 bucket=2–5 env=preview"]);
  });

  it("logs env=unknown outside Vercel", async () => {
    vi.stubEnv("VERCEL_ENV", undefined);
    await post(valid);
    expect(logs).toEqual(["[api/event] event=first_step_started stepCount=6 bucket=2–5 env=unknown"]);
  });

  it.each(["<2", "5–15", ">15"])("accepts the bucket %s", async (bucket) => {
    expect((await post({ ...valid, minutesSincePlanCreated: bucket })).status).toBe(204);
  });

  it.each([
    ["another event name", { ...valid, event: "page_view" }],
    ["an extra text field", { ...valid, brief: "My essay brief" }],
    ["an extra id", { ...valid, assignmentId: "p1" }],
    ["an unknown bucket", { ...valid, minutesSincePlanCreated: "about 3" }],
    ["a step count that isn't a whole number", { ...valid, stepCount: 2.5 }],
    ["a step count as text", { ...valid, stepCount: "6" }],
    ["zero steps", { ...valid, stepCount: 0 }],
    ["a missing field", { event: valid.event, stepCount: 6 }],
    ["an array", [valid]],
    ["not JSON", "event=first_step_started"],
  ])("rejects %s with 400, logging no body", async (_name, body) => {
    const response = await post(body);
    expect(response.status).toBe(400);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatch(/^\[api\/event\] 400 invalid-(json|body)$/);
  });

  it("rejects an oversized body with 413 before reading it as JSON", async () => {
    const response = await post({ ...valid, padding: "x".repeat(MAX_EVENT_BODY_CHARS) });
    expect(response.status).toBe(413);
    expect(logs).toEqual(["[api/event] 413 too-long"]);
  });

  it(`rate limits one IP after ${EVENT_PER_IP_LIMIT} events while another IP still gets through`, async () => {
    for (let i = 0; i < EVENT_PER_IP_LIMIT; i++) expect((await post(valid)).status).toBe(204);
    expect((await post(valid)).status).toBe(429);
    expect((await post(valid, "198.51.100.2")).status).toBe(204);
  });

  it("never logs the caller's IP", async () => {
    await post(valid);
    await post({ ...valid, event: "x" });
    expect(logs.join("\n")).not.toContain("203.0.113");
  });
});

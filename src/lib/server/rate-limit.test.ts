import { beforeEach, describe, expect, it } from "vitest";
import { allowPlanRequest, clientIp, GLOBAL_LIMIT, PER_IP_WINDOW_MS, resetPlanRateLimit } from "@/lib/server/rate-limit";

beforeEach(resetPlanRateLimit);

describe("allowPlanRequest", () => {
  it("allows 5 per IP in 10 minutes, then again once the window has passed", () => {
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) expect(allowPlanRequest("a", t + i)).toBe(true);
    expect(allowPlanRequest("a", t + 10)).toBe(false);
    expect(allowPlanRequest("b", t + 10)).toBe(true);
    expect(allowPlanRequest("a", t + PER_IP_WINDOW_MS + 5)).toBe(true);
  });

  it("caps everyone together at 100 an hour", () => {
    const t = 1_000_000;
    for (let i = 0; i < GLOBAL_LIMIT; i++) expect(allowPlanRequest(`ip-${i}`, t)).toBe(true);
    expect(allowPlanRequest("new", t + 1)).toBe(false);
    expect(allowPlanRequest("new", t + 60 * 60_000)).toBe(true);
  });
});

describe("clientIp", () => {
  it("takes the first x-forwarded-for entry", () => {
    const request = new Request("http://x", { headers: { "x-forwarded-for": " 203.0.113.9 , 10.0.0.1" } });
    expect(clientIp(request)).toBe("203.0.113.9");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});

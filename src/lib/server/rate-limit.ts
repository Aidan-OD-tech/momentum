import "server-only";

// Small in-memory request limits: a number per IP address in a window, and a number from everyone
// together in a longer window. Plans: 12 per 10 minutes per IP (raised from 5 in M7c, so a week's upload
// of up to 8 briefs, one request each, fits with room for a retry), 100 per hour overall. Events (M5):
// 10 per 10 minutes per IP, 300 per hour overall, kept apart so events never use up plan requests.
//
// Best effort only. On Vercel each running instance has its own memory, and a cold start resets it,
// so the real total can be higher. The hard cost guard is the monthly budget limit on the OpenAI
// project (docs/deploy.md).

const MINUTE = 60_000;
export const PER_IP_LIMIT = 12;
export const PER_IP_WINDOW_MS = 10 * MINUTE;
export const GLOBAL_LIMIT = 100;
export const GLOBAL_WINDOW_MS = 60 * MINUTE;

type Limits = { perIp: number; perIpWindowMs: number; global: number; globalWindowMs: number };

function createRateLimit(limits: Limits) {
  // Request times (ms) inside the current windows.
  let byIp = new Map<string, number[]>();
  let all: number[] = [];

  // Records the request and returns true if it's within both limits. A refused request isn't recorded.
  function allow(ip: string, now: number = Date.now()): boolean {
    all = all.filter((time) => now - time < limits.globalWindowMs);
    // Drop addresses with no recent requests, so the map doesn't grow without end.
    for (const [key, times] of byIp) {
      const recent = times.filter((time) => now - time < limits.perIpWindowMs);
      if (recent.length === 0) byIp.delete(key);
      else byIp.set(key, recent);
    }

    const mine = byIp.get(ip) ?? [];
    if (mine.length >= limits.perIp || all.length >= limits.global) return false;
    byIp.set(ip, [...mine, now]);
    all.push(now);
    return true;
  }

  function reset() {
    byIp = new Map();
    all = [];
  }

  return { allow, reset };
}

const planLimit = createRateLimit({ perIp: PER_IP_LIMIT, perIpWindowMs: PER_IP_WINDOW_MS, global: GLOBAL_LIMIT, globalWindowMs: GLOBAL_WINDOW_MS });
export const EVENT_PER_IP_LIMIT = 10;
const eventLimit = createRateLimit({ perIp: EVENT_PER_IP_LIMIT, perIpWindowMs: 10 * MINUTE, global: 300, globalWindowMs: 60 * MINUTE });

export const allowPlanRequest = planLimit.allow;
export const allowEventRequest = eventLimit.allow;

// The caller's IP: the first entry of x-forwarded-for. On Vercel this header is set by the platform
// and can't be spoofed by the caller. Used only as a key in memory; never logged or stored.
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// For tests.
export const resetPlanRateLimit = planLimit.reset;
export const resetEventRateLimit = eventLimit.reset;

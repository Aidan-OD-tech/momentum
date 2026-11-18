import "server-only";

// A small in-memory limit on plan requests: 5 per 10 minutes from one IP address, and 100 per hour
// from everyone together.
//
// Best effort only. On Vercel each running instance has its own memory, and a cold start resets it,
// so the real total can be higher. The hard cost guard is the monthly budget limit on the OpenAI
// project (docs/deploy.md).

const MINUTE = 60_000;
export const PER_IP_LIMIT = 5;
export const PER_IP_WINDOW_MS = 10 * MINUTE;
export const GLOBAL_LIMIT = 100;
export const GLOBAL_WINDOW_MS = 60 * MINUTE;

// Request times (ms) inside the current windows.
let byIp = new Map<string, number[]>();
let all: number[] = [];

// Records the request and returns true if it's within both limits. A refused request isn't recorded.
export function allowPlanRequest(ip: string, now: number = Date.now()): boolean {
  all = all.filter((time) => now - time < GLOBAL_WINDOW_MS);
  // Drop addresses with no recent requests, so the map doesn't grow without end.
  for (const [key, times] of byIp) {
    const recent = times.filter((time) => now - time < PER_IP_WINDOW_MS);
    if (recent.length === 0) byIp.delete(key);
    else byIp.set(key, recent);
  }

  const mine = byIp.get(ip) ?? [];
  if (mine.length >= PER_IP_LIMIT || all.length >= GLOBAL_LIMIT) return false;
  byIp.set(ip, [...mine, now]);
  all.push(now);
  return true;
}

// The caller's IP: the first entry of x-forwarded-for. On Vercel this header is set by the platform
// and can't be spoofed by the caller.
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// For tests.
export function resetPlanRateLimit() {
  byIp = new Map();
  all = [];
}

import { z } from "zod";
import { FIRST_STEP_EVENT, MINUTE_BUCKETS } from "@/lib/first-step-event";
import { allowEventRequest, clientIp } from "@/lib/server/rate-limit";

// POST /api/event: receives Momentum's one usage event, first_step_started, and writes one log line,
// e.g. "[api/event] event=first_step_started stepCount=6 bucket=2–5 env=production". It stores nothing. The counts
// are read in the Vercel logs (docs/evidence/measurement.md).
//
// Answers: 204 accepted; 400 not exactly this event and these two fields; 413 body too long;
// 429 rate limited. Rejections log only the status and a reason, never the body or the caller's IP.

export const runtime = "nodejs";

// A valid event is about 90 characters. (Vercel itself refuses bodies over 4.5 MB.)
export const MAX_EVENT_BODY_CHARS = 256;

// strictObject: any extra field (text, an id) makes the whole event invalid.
const EventSchema = z.strictObject({
  event: z.literal(FIRST_STEP_EVENT),
  minutesSincePlanCreated: z.enum(MINUTE_BUCKETS),
  // Plans start with 1 to 12 steps and the student can add more; 100 is only a sanity bound.
  stepCount: z.number().int().min(1).max(100),
});

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > MAX_EVENT_BODY_CHARS) return reject(413, "too-long");
  if (!allowEventRequest(clientIp(request))) return reject(429, "rate-limited");

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return reject(400, "invalid-json");
  }
  const parsed = EventSchema.safeParse(json);
  if (!parsed.success) return reject(400, "invalid-body");

  const { event, stepCount, minutesSincePlanCreated } = parsed.data;
  // VERCEL_ENV (production, preview or development) is set by Vercel, so preview and test traffic
  // can be filtered out of the production numbers. Locally it is unset: "unknown".
  const env = process.env.VERCEL_ENV ?? "unknown";
  console.info(`[api/event] event=${event} stepCount=${stepCount} bucket=${minutesSincePlanCreated} env=${env}`);
  return new Response(null, { status: 204 });
}

function reject(status: number, reason: string) {
  console.info(`[api/event] ${status} ${reason}`);
  return new Response(null, { status });
}

import type { Assignment } from "@/lib/types";

// The one usage event Momentum sends (M5): step 1 of a plan opened for the first time.
// It carries a time bucket and a step count, nothing else: no brief, plan or note text, and no ids.
// What it measures and how Aidan reads it: docs/evidence/measurement.md.

export const FIRST_STEP_EVENT = "first_step_started";
export const MINUTE_BUCKETS = ["<2", "2–5", "5–15", ">15"] as const;
export type MinuteBucket = (typeof MINUTE_BUCKETS)[number];

export type FirstStepStartedEvent = {
  event: typeof FIRST_STEP_EVENT;
  minutesSincePlanCreated: MinuteBucket;
  stepCount: number;
};

// Under 2 minutes, 2 to under 5, 5 to under 15, 15 or more.
export function minuteBucket(minutes: number): MinuteBucket {
  if (minutes < 2) return "<2";
  if (minutes < 5) return "2–5";
  if (minutes < 15) return "5–15";
  return ">15";
}

// The event for starting this assignment's step 1 at `at` (an ISO time), or null when step 1 was
// started before (firstStepStartedAt is set) or the plan has no creation time (saved before M5).
// Call it with the assignment as it was before startPlan.
export function firstStepStartedEvent(assignment: Assignment, at: string): FirstStepStartedEvent | null {
  if (assignment.firstStepStartedAt || !assignment.planCreatedAt) return null;
  const minutes = (Date.parse(at) - Date.parse(assignment.planCreatedAt)) / 60_000;
  if (!Number.isFinite(minutes)) return null;
  return { event: FIRST_STEP_EVENT, minutesSincePlanCreated: minuteBucket(minutes), stepCount: assignment.steps.length };
}

// Posts the event to /api/event, which writes one log line. Only a production build sends it
// (`npm start` locally, Vercel previews and production), never `npm run dev` or tests. A failed
// request is ignored: the event must never get in the student's way. Returns true if it was sent.
export function sendEvent(event: FirstStepStartedEvent, env: string | undefined = process.env.NODE_ENV): boolean {
  if (env !== "production") return false;
  fetch("/api/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    // Lets the request finish even if the tab is closed straight after Start step 1.
    keepalive: true,
  }).catch(() => {});
  return true;
}

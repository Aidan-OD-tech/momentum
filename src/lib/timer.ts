// The optional step timer, as plain data and pure functions. Client-side only, never stored (handoff).
// Time left is worked out from an end timestamp, not by counting ticks, so a slow or sleeping tab stays accurate.

export type TimerState =
  | { mode: "off" }
  | { mode: "running"; endsAt: number; hidden: boolean }
  | { mode: "paused"; remainingMs: number }
  | { mode: "ended" };

export const timerOff: TimerState = { mode: "off" };

export function startTimer(minutes: number, now: number): TimerState {
  return { mode: "running", endsAt: now + minutes * 60_000, hidden: false };
}

export function remainingMs(state: TimerState, now: number): number {
  if (state.mode === "running") return Math.max(0, state.endsAt - now);
  if (state.mode === "paused") return state.remainingMs;
  return 0;
}

// Called on every tick. A running timer (shown or hidden) becomes Ended when its time is up.
export function tickTimer(state: TimerState, now: number): TimerState {
  return state.mode === "running" && now >= state.endsAt ? { mode: "ended" } : state;
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  return state.mode === "running" ? { mode: "paused", remainingMs: remainingMs(state, now) } : state;
}

export function resumeTimer(state: TimerState, now: number): TimerState {
  return state.mode === "paused" ? { mode: "running", endsAt: now + state.remainingMs, hidden: false } : state;
}

// Hide collapses only the display; the countdown keeps running.
export function setTimerHidden(state: TimerState, hidden: boolean): TimerState {
  return state.mode === "running" ? { ...state, hidden } : state;
}

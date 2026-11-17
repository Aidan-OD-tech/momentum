import { describe, expect, it } from "vitest";
import { pauseTimer, remainingMs, resumeTimer, setTimerHidden, startTimer, tickTimer, timerOff } from "@/lib/timer";

const MIN = 60_000;

describe("timer logic", () => {
  it("counts down from an end time", () => {
    const running = startTimer(30, 0);
    expect(remainingMs(running, 5 * MIN)).toBe(25 * MIN);
  });

  it("pausing stops the countdown, resuming continues from where it stopped", () => {
    const paused = pauseTimer(startTimer(30, 0), 10 * MIN);
    expect(remainingMs(paused, 50 * MIN)).toBe(20 * MIN);
    const resumed = resumeTimer(paused, 50 * MIN);
    expect(remainingMs(resumed, 55 * MIN)).toBe(15 * MIN);
  });

  it("a hidden timer keeps running and reaches Ended", () => {
    const hidden = setTimerHidden(startTimer(30, 0), true);
    expect(tickTimer(hidden, 29 * MIN)).toBe(hidden);
    expect(tickTimer(hidden, 30 * MIN)).toEqual({ mode: "ended" });
  });

  it("a paused timer never ends on its own", () => {
    const paused = pauseTimer(startTimer(1, 0), 0);
    expect(tickTimer(paused, 99 * MIN)).toBe(paused);
  });

  it("hide and pause do nothing when the timer is off", () => {
    expect(setTimerHidden(timerOff, true)).toBe(timerOff);
    expect(pauseTimer(timerOff, 0)).toBe(timerOff);
  });
});

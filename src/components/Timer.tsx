"use client";

import { useEffect, useState } from "react";
import { ClockIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { formatCountdown, formatMinutes } from "@/lib/format";
import {
  pauseTimer,
  remainingMs,
  resumeTimer,
  setTimerHidden,
  startTimer,
  tickTimer,
  timerOff,
  type TimerState,
} from "@/lib/timer";
import { cn } from "@/lib/utils";

// The optional step timer (Figma "Timer (optional)"): Off, Running, Paused, Hidden, Ended.
// Lives only in this component: never stored, and gone when the step's screen unmounts
// (Finish for now, Mark complete, leaving the step). No timer action changes the step.
export function Timer({ minutes }: { minutes: number }) {
  const [state, setState] = useState<TimerState>(timerOff);
  const [now, setNow] = useState(() => Date.now());

  // While running (shown or hidden), check the clock every second.
  const running = state.mode === "running";
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const time = Date.now();
      setNow(time);
      setState((current) => tickTimer(current, time));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const act = (change: (current: TimerState, time: number) => TimerState) => {
    const time = Date.now();
    setNow(time);
    setState((current) => change(current, time));
  };

  const upText = minutes === 1 ? "1 minute is up" : `${minutes} minutes are up`;
  let line1: string;
  let line2: string;
  let actions: React.ReactNode;
  let muted = false;
  if (state.mode === "running" && state.hidden) {
    line1 = "Timer running";
    line2 = "Hidden from view";
    muted = true;
    actions = <TimerAction onClick={() => act((s) => setTimerHidden(s, false))}>Show</TimerAction>;
  } else if (state.mode === "running") {
    line1 = `${formatCountdown(remainingMs(state, now))} left`;
    line2 = `Counting down from about ${formatMinutes(minutes)}`;
    actions = (
      <>
        <TimerAction onClick={() => act(pauseTimer)}>Pause timer</TimerAction>
        <TimerAction onClick={() => act((s) => setTimerHidden(s, true))}>Hide</TimerAction>
      </>
    );
  } else if (state.mode === "paused") {
    line1 = `${formatCountdown(state.remainingMs)} left`;
    line2 = "Timer paused";
    actions = (
      <>
        <TimerAction onClick={() => act(resumeTimer)}>Resume timer</TimerAction>
        <TimerAction onClick={() => act(() => timerOff)}>Turn off</TimerAction>
      </>
    );
  } else if (state.mode === "ended") {
    line1 = upText;
    line2 = "Your step is still in progress. Keep going, or pause for later.";
    actions = <TimerAction onClick={() => act(() => timerOff)}>Dismiss</TimerAction>;
  } else {
    line1 = "Timer";
    line2 = "Optional · off";
    muted = true;
    actions = (
      <TimerAction onClick={() => act((_, time) => startTimer(minutes, time))}>
        Start a {formatMinutes(minutes)} timer
      </TimerAction>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className={cn("flex h-lh items-center text-body", muted ? "text-text-secondary" : "text-text-primary")}>
          <ClockIcon />
        </span>
        <div className="flex flex-col">
          <span className={cn("text-body-strong", muted ? "text-text-secondary" : "text-text-primary")}>{line1}</span>
          <span className="text-caption text-text-tertiary">{line2}</span>
        </div>
      </div>
      <div className="flex shrink-0 gap-3">{actions}</div>
      {/* Screen readers hear only the end, not every second. */}
      <p aria-live="polite" className="sr-only">
        {state.mode === "ended" ? upText : ""}
      </p>
    </div>
  );
}

function TimerAction({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button variant="tertiary" onClick={onClick}>
      {children}
    </Button>
  );
}

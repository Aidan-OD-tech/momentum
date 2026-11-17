import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Timer } from "@/components/Timer";

const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("Timer", () => {
  it("starts off, with the step estimate in the action", () => {
    render(<Timer minutes={25} />);
    expect(screen.getByText("Optional · off")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start a 25 min timer" })).toBeInTheDocument();
  });

  it("runs, pauses, resumes and turns off", () => {
    render(<Timer minutes={30} />);
    click("Start a 30 min timer");
    advance(78_000);
    expect(screen.getByText("28:42 left")).toBeInTheDocument();
    click("Pause timer");
    advance(60_000);
    expect(screen.getByText("28:42 left")).toBeInTheDocument();
    expect(screen.getByText("Timer paused")).toBeInTheDocument();
    click("Resume timer");
    advance(2_000);
    expect(screen.getByText("28:40 left")).toBeInTheDocument();
    click("Pause timer");
    click("Turn off");
    expect(screen.getByText("Optional · off")).toBeInTheDocument();
  });

  it("keeps counting while hidden, reaches Ended and announces only that", () => {
    const { container } = render(<Timer minutes={1} />);
    click("Start a 1 min timer");
    click("Hide");
    expect(screen.getByText("Timer running")).toBeInTheDocument();
    const liveRegion = container.querySelector('[aria-live="polite"]')!;
    expect(liveRegion.textContent).toBe("");
    advance(61_000);
    expect(screen.getByText("1 minute is up", { selector: "span" })).toBeInTheDocument();
    expect(liveRegion.textContent).toBe("1 minute is up");
    click("Dismiss");
    expect(screen.getByText("Optional · off")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "@/components/Progress";

function filledSegments(container: HTMLElement) {
  return container.querySelectorAll('[data-filled="true"]').length;
}
function totalSegments(container: HTMLElement) {
  return container.querySelectorAll("[data-filled]").length;
}

describe("Progress", () => {
  it.each([
    { done: 0, total: 6 },
    { done: 2, total: 6 },
    { done: 3, total: 4 },
    { done: 4, total: 9 },
    { done: 9, total: 9 },
  ])("shows $done of $total", ({ done, total }) => {
    const { container } = render(<Progress done={done} total={total} />);
    expect(totalSegments(container)).toBe(total);
    expect(filledSegments(container)).toBe(done);
    expect(screen.getByText(`${done} of ${total} steps done`)).toBeInTheDocument();
  });

  it("fills the first segments, not any others", () => {
    const { container } = render(<Progress done={2} total={4} />);
    const flags = Array.from(container.querySelectorAll("[data-filled]")).map((s) => s.getAttribute("data-filled"));
    expect(flags).toEqual(["true", "true", "false", "false"]);
  });

  it("never fills more than the total", () => {
    const { container } = render(<Progress done={7} total={4} />);
    expect(filledSegments(container)).toBe(4);
    expect(screen.getByText("4 of 4 steps done")).toBeInTheDocument();
  });

  it("says step, not steps, for a one-step plan", () => {
    render(<Progress done={0} total={1} />);
    expect(screen.getByText("0 of 1 step done")).toBeInTheDocument();
  });
});

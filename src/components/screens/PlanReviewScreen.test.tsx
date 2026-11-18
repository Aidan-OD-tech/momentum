import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanReviewScreen } from "@/components/screens/PlanReviewScreen";
import { createSamplePlan } from "@/data/sample-assignment";
import { reducer } from "@/lib/reducer";
import { STORAGE_KEY } from "@/lib/storage";
import type { MomentumData } from "@/lib/types";
import { router } from "@/test/navigation-mock";
import { renderApp } from "@/test/render-app";

vi.mock("next/navigation", () => import("@/test/navigation-mock"));

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// Stores the sample plan in review (optionally cut down to `stepCount` steps) and renders /plan.
function renderReview(stepCount?: number) {
  const plan = createSamplePlan();
  if (stepCount) plan.steps = plan.steps.slice(0, stepCount);
  const empty: MomentumData = { version: 1, activeAssignmentId: null, assignments: [] };
  const data = reducer(empty, { type: "createPlan", id: "p1", plan, brief: "The brief", deadlineOverride: "" });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  renderApp(<PlanReviewScreen />);
}

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!).assignments[0];
const button = (name: string | RegExp) => screen.getByRole("button", { name });
const start = () => button("Start step 1");

describe("plan review", () => {
  it("shows the derived meta, count and summed total", () => {
    renderReview();
    expect(screen.getByText("PSYC 3024 · Due Fri, Dec 4, 5:00 PM")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Urban green spaces essay" })).toBeInTheDocument();
    expect(screen.getByText("6 steps · about 3 h 20 min in total. Times are approximate.")).toBeInTheDocument();
    expect(screen.getByText("Due Fri, Dec 4, 5:00 PM")).toBeInTheDocument();
  });

  it("editing a step changes only that step and updates the total; Start step 1 waits for the edit", () => {
    renderReview();
    const before = stored().steps;
    fireEvent.click(button("Edit step 3"));
    expect(screen.getByText("Editing step 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Step title")).toHaveFocus();

    expect(start()).toHaveAttribute("aria-disabled", "true");
    expect(start()).toHaveAccessibleDescription("Finish editing to start.");
    fireEvent.click(start());
    expect(router.push).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Step title"), { target: { value: "Draft a thesis" } });
    fireEvent.change(screen.getByLabelText("What to do, item 1"), { target: { value: "Write one sentence" } });
    fireEvent.click(button("Increase time"));
    fireEvent.click(button("Done editing"));

    const after = stored().steps;
    expect(after[2]).toMatchObject({ title: "Draft a thesis", estimateMin: 35 });
    expect(after[2].whatToDo[0]).toBe("Write one sentence");
    expect(after.filter((_: unknown, i: number) => i !== 2)).toEqual(before.filter((_: unknown, i: number) => i !== 2));
    expect(screen.getByText("6 steps · about 3 h 25 min in total. Times are approximate.")).toBeInTheDocument();
    expect(button("Edit step 3")).toHaveFocus();
    expect(start()).not.toHaveAttribute("aria-disabled", "true");
  });

  it("Cancel discards the changes and returns focus to the row", () => {
    renderReview();
    fireEvent.click(button("Edit step 2"));
    fireEvent.change(screen.getByLabelText("Step title"), { target: { value: "Changed" } });
    fireEvent.click(button("Cancel"));
    expect(stored().steps[1].title).toBe("Find five sources");
    expect(button("Edit step 2")).toHaveFocus();
  });

  it("asks for a title and a Done when, focusing the first missing one", () => {
    renderReview();
    fireEvent.click(button("Edit step 1"));
    fireEvent.change(screen.getByLabelText("Step title"), { target: { value: " " } });
    fireEvent.change(screen.getByLabelText("Done when"), { target: { value: "" } });
    fireEvent.click(button("Done editing"));
    expect(screen.getByLabelText("Step title")).toHaveAccessibleDescription("Add a title.");
    expect(screen.getByLabelText("Done when")).toHaveAccessibleDescription("Add a Done when.");
    expect(screen.getByLabelText("Step title")).toHaveFocus();
    expect(stored().steps[0].title).toBe("Restate the prompt");
  });

  it("the stepper never goes below 5 minutes", () => {
    renderReview();
    fireEvent.click(button("Edit step 1"));
    expect(screen.getByText("5 min")).toBeInTheDocument();
    expect(button("Decrease time")).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(button("Decrease time"));
    expect(screen.getByText("5 min")).toBeInTheDocument();
  });

  it("Add a step opens its edit card at the end, and Done editing adds it", () => {
    renderReview();
    fireEvent.click(button("Add a step"));
    expect(screen.getByText("Editing step 7")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete step" })).not.toBeInTheDocument();
    expect(screen.getByText("15 min")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Step title"), { target: { value: "Ask a friend to read it" } });
    fireEvent.change(screen.getByLabelText("Done when"), { target: { value: "Someone has read it." } });
    fireEvent.click(button("Done editing"));
    expect(stored().steps).toHaveLength(7);
    expect(screen.getByText("7 steps · about 3 h 35 min in total. Times are approximate.")).toBeInTheDocument();
  });

  it("Delete step removes the step; it is hidden when only one step is left", () => {
    renderReview(2);
    fireEvent.click(button("Edit step 2"));
    fireEvent.click(button("Delete step"));
    expect(stored().steps).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Suggested steps" })).toHaveFocus();
    fireEvent.click(button("Edit step 1"));
    expect(screen.queryByRole("button", { name: "Delete step" })).not.toBeInTheDocument();
  });

  it("editing requirements shows the notice, never touches steps, and Review steps moves focus", () => {
    renderReview();
    const steps = stored().steps;
    fireEvent.click(button("Edit requirements"));
    expect(start()).toHaveAttribute("aria-disabled", "true");
    fireEvent.change(screen.getByLabelText("Requirement 2"), { target: { value: "Between 1,400 and 1,600 words" } });
    fireEvent.click(button("Remove requirement 4"));
    fireEvent.click(button("Add a requirement"));
    fireEvent.change(screen.getByLabelText("Requirement 5"), { target: { value: "Include one counterargument" } });
    fireEvent.click(button("Done"));

    const status = screen.getAllByRole("status").find((el) => el.textContent?.includes("Requirements updated"))!;
    expect(status).toHaveTextContent("Requirements updated. Your final checklist now matches.");
    expect(stored().steps).toEqual(steps);
    expect(stored().requirements.map((r: { label: string }) => r.label)).toEqual([
      "Takes a clear position on whether access to urban green space improves psychological wellbeing",
      "Between 1,400 and 1,600 words",
      "At least five peer-reviewed sources",
      "Submit through Turnitin by Fri, Dec 4, 5:00 PM",
      "Include one counterargument",
    ]);
    fireEvent.click(within(status).getByRole("button", { name: "Review steps" }));
    expect(screen.getByRole("heading", { name: "Suggested steps" })).toHaveFocus();
  });

  it("no notice when Done changes nothing", () => {
    renderReview();
    fireEvent.click(button("Edit requirements"));
    fireEvent.click(button("Done"));
    expect(screen.queryByText(/Requirements updated/)).not.toBeInTheDocument();
  });

  it("Start step 1 starts the plan and opens step 1", () => {
    renderReview();
    fireEvent.click(start());
    expect(stored().status).toBe("active");
    expect(stored().steps[0].status).toBe("inProgress");
    expect(router.push).toHaveBeenCalledWith("/step/1");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("sends a started plan home: no editing after starting", () => {
    const empty: MomentumData = { version: 1, activeAssignmentId: null, assignments: [] };
    const started = [
      { type: "createPlan" as const, id: "p1", plan: createSamplePlan(), brief: "b", deadlineOverride: "" },
      { type: "startPlan" as const },
    ].reduce(reducer, empty);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(started));
    renderApp(<PlanReviewScreen />);
    expect(router.replace).toHaveBeenCalledWith("/");
  });
});

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { usePanel } from "@/components/SidePanel";
import { STORAGE_KEY } from "@/lib/storage";
import type { AssignmentStatus } from "@/lib/types";
import { makeData } from "@/test/fixtures";
import { renderApp } from "@/test/render-app";

afterEach(() => localStorage.clear());

function OpenPlan() {
  const { openPanel } = usePanel();
  return <button onClick={() => openPanel("plan")}>open plan</button>;
}

function openPlanTab(status: AssignmentStatus) {
  const data = makeData(3);
  data.assignments[0].status = status;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  renderApp(<OpenPlan />);
  fireEvent.click(screen.getByRole("button", { name: "open plan" }));
}

describe("side panel, Plan tab footer", () => {
  it("in review, points to plan review for changes", () => {
    openPlanTab("review");
    expect(screen.getByText("To change steps, edit the plan from the plan review.")).toBeInTheDocument();
    expect(screen.queryByText("Steps can’t be changed after you start.")).not.toBeInTheDocument();
  });

  it.each(["active", "completed"] as const)("once the plan has started (%s), says steps can't be changed", (status) => {
    openPlanTab(status);
    expect(screen.getByText("Steps can’t be changed after you start.")).toBeInTheDocument();
    expect(screen.queryByText(/edit the plan from the plan review/)).not.toBeInTheDocument();
  });
});

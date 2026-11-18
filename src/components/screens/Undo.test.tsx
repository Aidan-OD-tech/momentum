import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FinalCheckScreen } from "@/components/screens/FinalCheckScreen";
import { StepCompleteScreen } from "@/components/screens/StepCompleteScreen";
import { reducer } from "@/lib/reducer";
import { STORAGE_KEY } from "@/lib/storage";
import { makeData } from "@/test/fixtures";
import { renderApp } from "@/test/render-app";

vi.mock("next/navigation", () => import("@/test/navigation-mock"));

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// Stores a plan of `stepCount` steps with steps 1..`done` completed in order, the last one undoable.
function storeCompleted(stepCount: number, done: number) {
  let data = makeData(stepCount);
  for (let n = 1; n <= done; n++) {
    data = reducer(data, { type: "openStep", n });
    data = reducer(data, { type: "completeStep", n });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

describe("Undo says what it undoes (signal 5)", () => {
  it("on step complete, Undo is described by the visible line “Step N is marked done.”", () => {
    storeCompleted(4, 2);
    renderApp(<StepCompleteScreen n={2} />);
    expect(screen.getByText("Step 2 is marked done.")).toBeVisible();
    const undo = screen.getByRole("button", { name: "Undo" });
    expect(undo).toHaveAccessibleDescription("Step 2 is marked done.");
  });

  it("on the final check, Undo is described by the same line", () => {
    storeCompleted(3, 3);
    renderApp(<FinalCheckScreen />);
    expect(screen.getByRole("button", { name: "Undo" })).toHaveAccessibleDescription("Step 3 is marked done.");
  });
});

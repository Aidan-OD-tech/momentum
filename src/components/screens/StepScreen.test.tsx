import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StepScreen } from "@/components/screens/StepScreen";
import { TopBar } from "@/components/TopBar";
import { reducer } from "@/lib/reducer";
import { STORAGE_KEY } from "@/lib/storage";
import { makeData } from "@/test/fixtures";
import { router } from "@/test/navigation-mock";
import { renderApp } from "@/test/render-app";

vi.mock("next/navigation", () => import("@/test/navigation-mock"));

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// A 5-step plan with steps 1..`done` completed, then step `open` opened (in progress) if given.
function store(done: number, open?: number) {
  let data = makeData(5);
  for (let n = 1; n <= done; n++) {
    data = reducer(data, { type: "openStep", n });
    data = reducer(data, { type: "completeStep", n });
  }
  if (open) data = reducer(data, { type: "openStep", n: open });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const rail = () => within(screen.getByRole("navigation", { name: "Your steps" }));

describe("a done step opened from the rail (H-17)", () => {
  it("the rail still lists the step in progress, marked as current, with aria-current on the step on screen", () => {
    store(2, 3);
    renderApp(<StepScreen n={1} />);
    const links = rail().getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Done: 1. Step title 1", "Done: 2. Step title 2", "In progress: 3. Step title 3"]);
    expect(rail().getByRole("link", { name: /1\. Step title 1/ })).toHaveAttribute("aria-current", "step");
    expect(rail().getByRole("link", { name: /3\. Step title 3/ })).not.toHaveAttribute("aria-current");
    expect(rail().queryByText(/Step title 4/)).not.toBeInTheDocument();
  });

  it("“Back to step N” opens the step in progress", () => {
    store(2, 3);
    renderApp(<StepScreen n={1} />);
    expect(screen.getByText("You marked this step done.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to step 3" }));
    expect(router.push).toHaveBeenCalledWith("/step/3");
  });

  it("with no step in progress, it offers “Back to home”", () => {
    store(2);
    renderApp(<StepScreen n={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to home" }));
    expect(router.push).toHaveBeenCalledWith("/");
  });

  it("a step in progress shows no Back button, and its own row is the current one", () => {
    store(2, 3);
    renderApp(<StepScreen n={3} />);
    expect(screen.queryByRole("button", { name: /Back to/ })).not.toBeInTheDocument();
    expect(rail().getByRole("link", { name: "3. Step title 3" })).toHaveAttribute("aria-current", "step");
  });
});

describe("the wordmark", () => {
  it("is a link home named “Momentum, home”", () => {
    render(<TopBar mode="session" context="PSYC 3024" />);
    expect(screen.getByRole("link", { name: "Momentum, home" })).toHaveAttribute("href", "/");
  });
});

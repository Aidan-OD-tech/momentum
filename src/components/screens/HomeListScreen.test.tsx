import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FinalCheckScreen } from "@/components/screens/FinalCheckScreen";
import { HomeRoute } from "@/components/screens/HomeRoute";
import { SidePanelProvider } from "@/components/SidePanel";
import { MomentumProvider, WhenLoaded, WhenStarted } from "@/lib/momentum-store";
import { PlanSourceProvider } from "@/lib/plan-source";
import { STORAGE_KEY } from "@/lib/storage";
import type { MomentumData } from "@/lib/types";
import { HOME_LIST_NOW, makeAssignment, mixedHomeList } from "@/test/fixtures";
import { router } from "@/test/navigation-mock";
import { renderApp, samplePlanStub } from "@/test/render-app";

vi.mock("next/navigation", () => import("@/test/navigation-mock"));

beforeEach(() => {
  // Only Date is faked, so timers (and user-event) run as usual.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(HOME_LIST_NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  localStorage.clear();
});

function store(data: MomentumData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const stored = (): MomentumData => JSON.parse(localStorage.getItem(STORAGE_KEY)!);
const section = (name: string) => screen.getByRole("region", { name });
const rowTitles = (name: string) => within(section(name)).queryAllByRole("heading", { level: 3 }).map((h) => h.textContent);

function renderList(data: MomentumData = mixedHomeList()) {
  store(data);
  return renderApp(<HomeRoute />);
}

describe("home list", () => {
  it("shows brief entry on first run, with no assignments at all", () => {
    renderApp(<HomeRoute />);
    expect(screen.getByRole("heading", { level: 1, name: "Turn an assignment brief into small, doable steps." })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Back to your assignments" })).not.toBeInTheDocument();
  });

  it("doesn't redirect a plan in review to /plan; it is on the list as Ready to review", () => {
    renderList({ version: 1, activeAssignmentId: "r", assignments: [makeAssignment("r", 3, { status: "review", title: "Only plan" })] });
    expect(router.replace).not.toHaveBeenCalled();
    expect(within(section("Up next")).getByText("Plan ready · 3 steps · About 1 h 20 min")).toBeInTheDocument();
    expect(within(section("Up next")).getByRole("button", { name: "Review plan" })).toBeInTheDocument();
  });

  it("puts h1 first, focused, then h2 groups, and the intro line", () => {
    renderList();
    const h1 = screen.getByRole("heading", { level: 1, name: "Your assignments" });
    expect(h1).toHaveFocus();
    expect(
      screen.getByText("Soonest deadline first. Time left adds up the estimates for steps you haven’t finished, so it’s approximate."),
    ).toBeInTheDocument();
    const levels = screen.getAllByRole("heading").map((h) => Number(h.tagName.slice(1)));
    expect(levels[0]).toBe(1);
    expect(levels[1]).toBe(2);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "Up next",
      "After that",
      "No deadline",
      "Finished (2) · kept in this browser",
    ]);
  });

  it("follows the priority order; the first is Up next and isn't repeated below", () => {
    renderList();
    expect(within(section("Up next")).getByRole("heading", { level: 3 })).toHaveTextContent("Lab report 4");
    expect(rowTitles("After that")).toEqual(["Problem set 6", "Reading response", "Urban green spaces essay"]);
    expect(rowTitles("No deadline")).toEqual(["Portfolio reflection"]);
    expect(screen.getAllByRole("heading", { name: "Lab report 4" })).toHaveLength(1);
  });

  it("shows each row's status line, and Ready to review only on the plan in review", () => {
    renderList();
    const after = section("After that");
    expect(within(after).getByText("Plan ready · 9 steps · About 4 h 30 min")).toBeInTheDocument();
    expect(within(after).getByText("Not started · 1 step · About 30 min")).toBeInTheDocument();
    expect(within(after).getByText("All steps done · Final check next")).toBeInTheDocument();
    expect(within(after).getAllByText("Ready to review")).toHaveLength(1);
    expect(within(section("No deadline")).getByText("4 of 9 steps done · About 2 h 30 min of steps left")).toBeInTheDocument();
  });

  it("says Due date passed for a deadline before now, without warning words", () => {
    renderList();
    expect(within(section("Up next")).getByText("CHEM 2010 · Due date passed · Mon, Nov 16, 5:00 PM")).toBeInTheDocument();
    expect(within(section("After that")).getByText("MATH 2210 · Due Fri, Nov 20, 9:00 AM")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\b(overdue|late|behind|urgent)\b|!/i);
  });

  it("gives every row button a name that includes the title", () => {
    renderList();
    expect(screen.getByRole("button", { name: "Review plan Problem set 6" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Reading response" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Urban green spaces essay" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Portfolio reflection" })).toBeInTheDocument();
  });

  it.each([
    ["Review plan Problem set 6", "problems", "/plan"],
    ["Open Reading response", "reading", "/step/1"],
    ["Open Urban green spaces essay", "essay", "/final"],
    ["Open Portfolio reflection", "portfolio", "/step/5"],
  ])("%s opens that assignment, then goes to %s's page", (name, id, path) => {
    renderList();
    fireEvent.click(screen.getByRole("button", { name }));
    expect(stored().activeAssignmentId).toBe(id);
    expect(router.push).toHaveBeenCalledWith(path);
  });

  it("Add assignments goes to /new", () => {
    renderList();
    fireEvent.click(screen.getByRole("button", { name: "Add assignments" }));
    expect(router.push).toHaveBeenCalledWith("/new");
  });

  describe("Up next", () => {
    it("paused: shows the note and resumes that assignment's step, though another was open", () => {
      renderList();
      expect(mixedHomeList().activeAssignmentId).toBe("essay");
      const upNext = section("Up next");
      expect(within(upNext).getByText("Step 2 · In progress")).toBeInTheDocument();
      expect(within(upNext).getByText(/Halfway through the method section/)).toBeInTheDocument();
      expect(within(upNext).getByText("1 of 3 steps done · About 1 h of steps left")).toBeInTheDocument();
      fireEvent.click(within(upNext).getByRole("button", { name: "Resume step 2" }));
      expect(stored().activeAssignmentId).toBe("lab");
      expect(router.push).toHaveBeenCalledWith("/step/2");
    });

    it("View full plan opens the plan panel for that assignment", () => {
      renderList();
      fireEvent.click(within(section("Up next")).getByRole("button", { name: "View full plan" }));
      expect(within(screen.getByRole("dialog")).getByText(/Lab report 4 · 3 steps/)).toBeInTheDocument();
      expect(stored().activeAssignmentId).toBe("lab");
    });

    it("between steps: offers the next step with its estimate", () => {
      const steps = makeAssignment("n", 9).steps.map((step, i) => ({ ...step, status: i < 2 ? ("done" as const) : ("upcoming" as const) }));
      renderList({ version: 1, activeAssignmentId: null, assignments: [makeAssignment("n", 9, { steps })] });
      const upNext = section("Up next");
      expect(within(upNext).getByText("Next up · Step 3 · about 30 min for the full step")).toBeInTheDocument();
      fireEvent.click(within(upNext).getByRole("button", { name: "Start step 3" }));
      expect(stored().activeAssignmentId).toBe("n");
      expect(router.push).toHaveBeenCalledWith("/step/3");
    });

    it("all steps done: points to the final check, with no time left", () => {
      const done = makeAssignment("d", 1, { steps: makeAssignment("d", 1).steps.map((s) => ({ ...s, status: "done" as const })) });
      renderList({ version: 1, activeAssignmentId: "d", assignments: [done] });
      const upNext = section("Up next");
      expect(within(upNext).getByText("Next up · Final check")).toBeInTheDocument();
      expect(within(upNext).getByText("1 of 1 step done")).toBeInTheDocument();
      fireEvent.click(within(upNext).getByRole("button", { name: "Go to the final check" }));
      expect(router.push).toHaveBeenCalledWith("/final");
    });
  });

  describe("Finished", () => {
    it("is collapsed, opens with Enter and closes with Space, and its rows go to /review", async () => {
      const user = userEvent.setup();
      renderList();
      const toggle = screen.getByRole("button", { name: "Finished (2) · kept in this browser" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("button", { name: "Review Annotated bibliography" })).not.toBeInTheDocument();

      toggle.focus();
      await user.keyboard("{Enter}");
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      const list = within(section("Finished (2) · kept in this browser"));
      expect(list.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Annotated bibliography", "Quiz prep"]);
      expect(list.getByText("Final check reviewed Nov 10")).toBeInTheDocument();
      expect(list.getByText("All steps done")).toBeInTheDocument();

      fireEvent.click(list.getByRole("button", { name: "Review Quiz prep" }));
      expect(stored().activeAssignmentId).toBe("quiz");
      expect(router.push).toHaveBeenCalledWith("/review");

      toggle.focus();
      await user.keyboard(" ");
      expect(toggle).toHaveAttribute("aria-expanded", "false");
    });

    it("everything finished: Nothing in progress, Add assignments, and Finished below", () => {
      const data = mixedHomeList();
      data.assignments = data.assignments.filter((a) => a.status === "completed");
      renderList(data);
      expect(screen.queryByRole("region", { name: "Up next" })).not.toBeInTheDocument();
      expect(screen.getByText("Nothing in progress.")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: "Add assignments" })).toHaveLength(2);
      expect(screen.getByRole("button", { name: "Finished (2) · kept in this browser" })).toBeInTheDocument();
    });
  });

  it("hides a group heading when its group is empty", () => {
    renderList({ version: 1, activeAssignmentId: null, assignments: [makeAssignment("a", 3)] });
    expect(screen.queryByRole("heading", { name: "After that" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "No deadline" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Finished/ })).not.toBeInTheDocument();
  });
});

describe("Finish review, then the home list", () => {
  // The app's providers around whichever screen the route shows, so state survives the route change.
  function App({ route }: { route: "/final" | "/" }) {
    return (
      <MomentumProvider>
        <SidePanelProvider>
          <PlanSourceProvider source={samplePlanStub}>
            <WhenLoaded>
              {route === "/final" ? (
                <WhenStarted>
                  <FinalCheckScreen />
                </WhenStarted>
              ) : (
                <HomeRoute />
              )}
            </WhenLoaded>
          </PlanSourceProvider>
        </SidePanelProvider>
      </MomentumProvider>
    );
  }

  const LINE =
    "Urban green spaces essay: all steps done. Your plan and final check are kept in this browser. Submission happens in Turnitin. Momentum doesn’t submit or track it.";

  it("shows the completion line once; a reload clears it", () => {
    store(mixedHomeList());
    const { rerender, unmount } = render(<App route="/final" />);
    fireEvent.click(screen.getByRole("button", { name: "Finish review" }));
    expect(router.push).toHaveBeenCalledWith("/");
    rerender(<App route="/" />);
    expect(screen.getByRole("heading", { level: 1, name: "Your assignments" })).toBeInTheDocument();
    expect(screen.getByText(LINE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finished (3) · kept in this browser" })).toBeInTheDocument();

    // A reload: a fresh provider reads storage again, and the in-memory line is gone.
    unmount();
    render(<App route="/" />);
    expect(screen.getByRole("heading", { level: 1, name: "Your assignments" })).toBeInTheDocument();
    expect(screen.queryByText(LINE)).not.toBeInTheDocument();
  });

  it("isn't shown when the write failed", () => {
    store(mixedHomeList());
    const { rerender } = render(<App route="/final" />);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    fireEvent.click(screen.getByRole("button", { name: "Finish review" }));
    act(() => rerender(<App route="/" />));
    expect(screen.queryByText(LINE)).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });
});

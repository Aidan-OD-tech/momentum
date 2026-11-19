import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BriefFlow } from "@/components/screens/BriefFlow";
import { HomeRoute } from "@/components/screens/HomeRoute";
import { createSamplePlan, sampleAssignment } from "@/data/sample-assignment";
import { MAX_BRIEF_CHARS } from "@/lib/brief-limits";
import { WhenLoaded } from "@/lib/momentum-store";
import type { BuildResult, PlanSource } from "@/lib/plan-source";
import { STORAGE_KEY } from "@/lib/storage";
import type { MomentumData } from "@/lib/types";
import { makeAssignment } from "@/test/fixtures";
import { router } from "@/test/navigation-mock";
import { AppProviders } from "@/test/render-app";

vi.mock("next/navigation", () => import("@/test/navigation-mock"));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  localStorage.clear();
});

// Requests stay out until the test answers them.
function controlledSource() {
  const calls: { brief: string; deadline?: string; answer: (result: BuildResult) => Promise<void> }[] = [];
  const source: PlanSource = {
    build: (input) =>
      new Promise((resolve) => {
        calls.push({ ...input, answer: (result) => act(async () => resolve(result)) });
      }),
  };
  return { source, calls };
}

const plan = (title: string): BuildResult => ({ ok: true, plan: { ...createSamplePlan(), title } });
const stored = (): MomentumData => JSON.parse(localStorage.getItem(STORAGE_KEY)!);

// /new with one assignment already on the list.
function withAssignment() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, activeAssignmentId: "a1", assignments: [makeAssignment("a1", 3)] }));
}

function renderNew(source: PlanSource = controlledSource().source) {
  return render(
    <AppProviders source={source}>
      <WhenLoaded>
        <BriefFlow atNew />
      </WhenLoaded>
    </AppProviders>,
  );
}

const addBrief = () => fireEvent.click(screen.getByRole("button", { name: "Add another brief" }));
const brief = (n: number) => screen.getByRole("textbox", { name: `Brief ${n}` });
const typeIn = (n: number, text: string) => fireEvent.change(brief(n), { target: { value: text } });
// Text in the visible list of the building screen (the live region repeats it).
const inRows = (text: string) => within(screen.getByRole("list")).getByText(text);
const submitButton = () => screen.getByRole("button", { name: /^(Break it down|Build \d+ plans)$/ });

// Three cards on /new: briefs 1 and 3 with text, brief 2 empty.
function threeBriefs(source?: PlanSource) {
  withAssignment();
  renderNew(source);
  addBrief();
  addBrief();
  typeIn(1, "First brief text");
  typeIn(3, "Third brief text");
}

describe("brief entry with several briefs", () => {
  it("/new has its own heading and intro; first run keeps today's", () => {
    withAssignment();
    renderNew();
    expect(screen.getByRole("heading", { level: 1, name: "Add this week’s assignments" })).toBeInTheDocument();
    expect(
      screen.getByText("Paste each brief on its own. Momentum builds one plan per brief, one at a time, and you review each plan before you start."),
    ).toBeInTheDocument();
  });

  it("one brief looks as it always has: no card, no Remove", () => {
    withAssignment();
    renderNew();
    expect(screen.getByLabelText("Assignment brief")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Brief 1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Remove/ })).not.toBeInTheDocument();
  });

  it("Add another brief adds a card, focuses its text area, and stops at 8 with the caption", () => {
    withAssignment();
    renderNew();
    addBrief();
    expect(brief(2)).toHaveFocus();
    for (let i = 0; i < 6; i++) addBrief();
    expect(brief(8)).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Add another brief" })).not.toBeInTheDocument();
    expect(screen.getByText("You can add up to 8 briefs at a time.")).toBeInTheDocument();
  });

  it("gives every brief and deadline its own label, and every card a heading and Remove", () => {
    threeBriefs();
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Brief 1", "Brief 2", "Brief 3"]);
    expect(screen.getByLabelText(/^Deadline for brief 2/)).toHaveAttribute("type", "datetime-local");
    expect(screen.getByRole("button", { name: "Remove brief 3" })).toBeInTheDocument();
  });

  it("counts the briefs with text: Build 2 plans, and a caption about the empty one", () => {
    threeBriefs();
    expect(submitButton()).toHaveTextContent("Build 2 plans");
    expect(screen.getByText("2 briefs ready. Empty briefs are skipped.")).toBeInTheDocument();
    typeIn(3, "");
    expect(submitButton()).toHaveTextContent("Break it down");
    expect(screen.getByText("1 brief ready. Empty briefs are skipped.")).toBeInTheDocument();
  });

  it("removing a brief with text can be undone; focus goes to the card that took its place", () => {
    threeBriefs();
    typeIn(2, "Second brief text");
    fireEvent.click(screen.getByRole("button", { name: "Remove brief 2" }));
    expect(screen.getByRole("heading", { name: "Brief 2" })).toHaveFocus();
    expect(brief(2)).toHaveValue("Third brief text");
    expect(screen.getByText("Brief 2 removed.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(brief(2)).toHaveValue("Second brief text");
    expect(brief(2)).toHaveFocus();
    expect(brief(3)).toHaveValue("Third brief text");
  });

  it("removing an empty brief needs no undo; removing the last one focuses Add another brief", () => {
    threeBriefs();
    fireEvent.click(screen.getByRole("button", { name: "Remove brief 2" }));
    expect(screen.queryByText(/removed\./)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove brief 2" }));
    expect(screen.getByText("Brief 2 removed.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add another brief" })).toHaveFocus();
  });

  it("at 8, a removed brief that can be undone keeps its place: Add hides, and Undo brings it back (risk 3)", () => {
    withAssignment();
    renderNew();
    for (let i = 0; i < 7; i++) addBrief();
    for (let n = 1; n <= 8; n++) typeIn(n, `Text ${n}`);
    fireEvent.click(screen.getByRole("button", { name: "Remove brief 3" }));
    // 7 on screen plus the one that can be undone: no room to add.
    expect(screen.queryByRole("button", { name: "Add another brief" })).not.toBeInTheDocument();
    expect(screen.getByText("You can add up to 8 briefs at a time.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Brief 3" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    const texts = screen.getAllByRole("textbox").filter((t) => t.tagName === "TEXTAREA").map((t) => (t as HTMLTextAreaElement).value);
    expect(texts).toEqual(["Text 1", "Text 2", "Text 3", "Text 4", "Text 5", "Text 6", "Text 7", "Text 8"]);
  });

  it("at 8, removing the last brief with text focuses its Undo; an empty one frees a place", () => {
    withAssignment();
    renderNew();
    for (let i = 0; i < 7; i++) addBrief();
    typeIn(8, "Text 8");
    fireEvent.click(screen.getByRole("button", { name: "Remove brief 8" }));
    expect(screen.getByRole("button", { name: "Undo" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    typeIn(8, "");
    fireEvent.click(screen.getByRole("button", { name: "Remove brief 8" }));
    expect(screen.getByRole("button", { name: "Add another brief" })).toHaveFocus();
  });

  it("no brief with text: Error 01 on the first brief, focus there, no request", () => {
    const { source, calls } = controlledSource();
    withAssignment();
    renderNew(source);
    addBrief();
    fireEvent.click(submitButton());
    expect(brief(1)).toHaveFocus();
    expect(brief(1)).toHaveAccessibleDescription("Paste your brief first, so there’s something to break down.");
    expect(calls).toHaveLength(0);
  });

  it("a brief over the limit blocks sending and gets focus", () => {
    const { source, calls } = controlledSource();
    threeBriefs(source);
    typeIn(3, "a".repeat(MAX_BRIEF_CHARS + 1));
    fireEvent.click(submitButton());
    expect(brief(3)).toHaveFocus();
    expect(calls).toHaveLength(0);
  });

  it("saves every brief with text or a deadline as briefDrafts, straight away on building", () => {
    const { source } = controlledSource();
    threeBriefs(source);
    fireEvent.change(screen.getByLabelText(/^Deadline for brief 3/), { target: { value: "2026-12-10T09:30" } });
    fireEvent.click(submitButton());
    expect(stored().briefDrafts!.map((d) => [d.text, d.deadline])).toEqual([
      ["First brief text", ""],
      ["Third brief text", "2026-12-10T09:30"],
    ]);
  });

  it("restores several drafts after a reload", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        activeAssignmentId: "a1",
        assignments: [makeAssignment("a1", 1)],
        briefDrafts: [
          { id: "x", text: "Kept one", deadline: "" },
          { id: "y", text: "Kept two", deadline: "" },
        ],
      }),
    );
    renderNew();
    expect(brief(1)).toHaveValue("Kept one");
    expect(brief(2)).toHaveValue("Kept two");
  });

  it("with the sample flag on, Use a sample brief fills the first empty brief", () => {
    vi.stubEnv("NEXT_PUBLIC_SHOW_SAMPLE_BRIEF", "true");
    threeBriefs();
    fireEvent.click(screen.getByRole("button", { name: "Use a sample brief" }));
    expect(brief(2)).toHaveValue(sampleAssignment.brief);
    expect(brief(1)).toHaveValue("First brief text");
  });
});

describe("building several plans", () => {
  it("shows one row per brief with text, builds them one at a time, then offers the list", async () => {
    const { source, calls } = controlledSource();
    threeBriefs(source);
    fireEvent.click(submitButton());
    expect(screen.getByRole("heading", { level: 1, name: "Building your plans" })).toBeInTheDocument();
    const rows = () => within(screen.getByRole("list")).getAllByRole("listitem").map((li) => li.textContent);
    // Brief N is the card's number, so the third card stays Brief 3.
    expect(rows()).toEqual(["Brief 1 · building the plan", "Brief 3 · waiting"]);
    expect(calls).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Go to your assignments" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop after this one" })).toBeInTheDocument();

    await calls[0].answer(plan("Lab report 5"));
    expect(rows()).toEqual(["Lab report 5 · plan ready", "Brief 3 · building the plan"]);
    // The live region gets one line per change.
    expect(within(screen.getAllByRole("status").at(-1)!).getByText("Lab report 5 · plan ready")).toBeInTheDocument();

    await calls[1].answer(plan("Problem set 7"));
    expect(screen.queryByRole("button", { name: "Stop after this one" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Go to your assignments" }));
    expect(router.push).toHaveBeenCalledWith("/");
    // Added after the assignment already there, in review, without opening either.
    expect(stored().assignments.slice(1).map((a) => [a.title, a.status])).toEqual([
      ["Lab report 5", "review"],
      ["Problem set 7", "review"],
    ]);
    expect(stored().activeAssignmentId).toBe("a1");
  });

  it("unreadable: keeps the brief, goes on, and Edit brief returns to only the briefs not built", async () => {
    const { source, calls } = controlledSource();
    threeBriefs(source);
    fireEvent.click(submitButton());
    await calls[0].answer({ ok: false, reason: "unreadable" });
    expect(inRows("Brief 1 · couldn’t find clear requirements")).toBeInTheDocument();
    expect(screen.getByText("Your brief is kept. Edit it and try again.")).toBeInTheDocument();
    // Not while brief 3 is being built.
    expect(screen.queryByRole("button", { name: "Edit brief 1" })).not.toBeInTheDocument();
    await calls[1].answer(plan("Problem set 7"));
    fireEvent.click(screen.getByRole("button", { name: "Edit brief 1" }));
    expect(screen.getByRole("heading", { level: 1, name: "Add this week’s assignments" })).toBeInTheDocument();
    expect(screen.getByLabelText("Assignment brief")).toHaveValue("First brief text");
  });

  it("failed: Try again builds it again after the others", async () => {
    const { source, calls } = controlledSource();
    threeBriefs(source);
    fireEvent.click(submitButton());
    await calls[0].answer({ ok: false, reason: "failed" });
    expect(inRows("Brief 1 · couldn’t build this plan")).toBeInTheDocument();
    expect(screen.getByText("Your brief is kept.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again: brief 1" }));
    await calls[1].answer(plan("Problem set 7"));
    expect(calls.map((c) => c.brief)).toEqual(["First brief text", "Third brief text", "First brief text"]);
  });

  it("a 429 stops the queue with the M6 line and leaves the rest as drafts", async () => {
    const { source, calls } = controlledSource();
    threeBriefs(source);
    fireEvent.click(submitButton());
    await calls[0].answer({ ok: false, reason: "rateLimited" });
    expect(screen.getByText("Too many plans were built from this network. Try again in about 10 minutes.")).toBeInTheDocument();
    expect(inRows("Brief 1 · not built yet · your brief is kept")).toBeInTheDocument();
    expect(inRows("Brief 3 · not built yet · your brief is kept")).toBeInTheDocument();
    expect(calls).toHaveLength(1);
    expect(stored().briefDrafts).toHaveLength(2);
    // Back to your briefs returns to entry with both, ready to build again (risk 2).
    fireEvent.click(screen.getByRole("button", { name: "Back to your briefs" }));
    expect(brief(1)).toHaveValue("First brief text");
    expect(brief(2)).toHaveValue("Third brief text");
  });

  it("offers Back to your briefs only when the run ended with briefs not built", async () => {
    const { source, calls } = controlledSource();
    threeBriefs(source);
    fireEvent.click(submitButton());
    expect(screen.queryByRole("button", { name: "Back to your briefs" })).not.toBeInTheDocument();
    await calls[0].answer(plan("Lab report 5"));
    await calls[1].answer(plan("Problem set 7"));
    expect(screen.queryByRole("button", { name: "Back to your briefs" })).not.toBeInTheDocument();
  });

  it("Stop after this one finishes the current request; the rest stay drafts", async () => {
    const { source, calls } = controlledSource();
    threeBriefs(source);
    fireEvent.click(submitButton());
    fireEvent.click(screen.getByRole("button", { name: "Stop after this one" }));
    expect(screen.getByText("Stopping after the plan being built now.")).toBeInTheDocument();
    await calls[0].answer(plan("Lab report 5"));
    expect(calls).toHaveLength(1);
    expect(inRows("Brief 3 · not built yet · your brief is kept")).toBeInTheDocument();
    expect(stored().briefDrafts!.map((d) => d.text)).toEqual(["Third brief text"]);
  });

  it("from first-run brief entry, it moves to /new", () => {
    const { source } = controlledSource();
    render(
      <AppProviders source={source}>
        <WhenLoaded>
          <HomeRoute />
        </WhenLoaded>
      </AppProviders>,
    );
    fireEvent.change(screen.getByLabelText("Assignment brief"), { target: { value: "One" } });
    addBrief();
    typeIn(2, "Two");
    fireEvent.click(submitButton());
    expect(router.push).toHaveBeenCalledWith("/new");
  });

  it("keeps running on the home list, which shows the building line, then Ready to review rows", async () => {
    const { source, calls } = controlledSource();
    withAssignment();
    function App({ route }: { route: "/new" | "/" }) {
      return (
        <AppProviders source={source}>
          <WhenLoaded>{route === "/new" ? <BriefFlow atNew /> : <HomeRoute />}</WhenLoaded>
        </AppProviders>
      );
    }
    const { rerender } = render(<App route="/new" />);
    addBrief();
    typeIn(1, "First brief text");
    typeIn(2, "Second brief text");
    fireEvent.click(submitButton());

    // Leave /new for the list while the first request is out.
    rerender(<App route="/" />);
    const line = screen.getByRole("link", { name: "Building plans: 0 of 2 ready" });
    expect(line).toHaveAttribute("href", "/new");
    await calls[0].answer(plan("Lab report 5"));
    expect(screen.getByRole("link", { name: "Building plans: 1 of 2 ready" })).toBeInTheDocument();
    expect(calls).toHaveLength(2);
    await calls[1].answer(plan("Problem set 7"));
    expect(screen.queryByRole("link", { name: /Building plans/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("Ready to review")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Review plan Problem set 7" })).toBeInTheDocument();
  });

  it("a plan whose save failed is never called ready", async () => {
    const { source, calls } = controlledSource();
    threeBriefs(source);
    fireEvent.click(submitButton());
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    await calls[0].answer(plan("Lab report 5"));
    expect(screen.queryByText(/plan ready/)).not.toBeInTheDocument();
    expect(inRows("Lab report 5 · built, but couldn’t be saved in this browser. It’s gone if you reload.")).toBeInTheDocument();
    expect(screen.getByText("Couldn’t save in this browser")).toBeInTheDocument();
    // The queue stopped; brief 3 is still a draft, and nothing more was sent.
    expect(inRows("Brief 3 · not built yet · your brief is kept")).toBeInTheDocument();
    expect(calls).toHaveLength(1);
    vi.restoreAllMocks();
  });

  it("after the run, the list says which briefs weren't built and links back to /new (risk 1)", async () => {
    const { source, calls } = controlledSource();
    withAssignment();
    function App({ route }: { route: "/new" | "/" }) {
      return (
        <AppProviders source={source}>
          <WhenLoaded>{route === "/new" ? <BriefFlow atNew /> : <HomeRoute />}</WhenLoaded>
        </AppProviders>
      );
    }
    const { rerender } = render(<App route="/new" />);
    addBrief();
    addBrief();
    typeIn(1, "First brief text");
    typeIn(2, "Second brief text");
    typeIn(3, "Third brief text");
    fireEvent.click(submitButton());
    rerender(<App route="/" />);
    // While it runs, only the building line.
    expect(screen.queryByRole("link", { name: /not built yet/ })).not.toBeInTheDocument();
    await calls[0].answer({ ok: false, reason: "unreadable" });
    await calls[1].answer({ ok: false, reason: "failed" });
    await calls[2].answer(plan("Problem set 7"));
    const line = screen.getByRole("link", { name: "2 briefs not built yet" });
    expect(line).toHaveAttribute("href", "/new");
  });

  it("after a reload, kept briefs show as one line on the list", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, activeAssignmentId: "a1", assignments: [makeAssignment("a1", 1)], briefDrafts: [{ id: "x", text: "Kept", deadline: "" }, { id: "y", text: "", deadline: "2026-12-01T09:00" }] }),
    );
    render(
      <AppProviders>
        <WhenLoaded>
          <HomeRoute />
        </WhenLoaded>
      </AppProviders>,
    );
    // A brief with only a deadline has nothing to build, so it isn't counted.
    expect(screen.getByRole("link", { name: "1 brief not built yet" })).toBeInTheDocument();
  });
});

import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BriefFlow } from "@/components/screens/BriefFlow";
import { HomeRoute } from "@/components/screens/HomeRoute";
import { sampleAssignment } from "@/data/sample-assignment";
import { BRIEF_COUNT_FROM, MAX_BRIEF_CHARS } from "@/lib/brief-limits";
import { apiPlanSource, type BuildResult, type PlanSource } from "@/lib/plan-source";
import { STORAGE_KEY } from "@/lib/storage";
import { makeAssignment } from "@/test/fixtures";
import { router } from "@/test/navigation-mock";
import { renderApp } from "@/test/render-app";

vi.mock("next/navigation", () => import("@/test/navigation-mock"));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  localStorage.clear();
});

// A source that answers with `result` and records each call and its signal.
function stub(result: BuildResult | "never") {
  const calls: { brief: string; deadline?: string; signal: AbortSignal }[] = [];
  const source: PlanSource = {
    build: (input, signal) => {
      calls.push({ ...input, signal });
      return result === "never" ? new Promise(() => {}) : Promise.resolve(result);
    },
  };
  return { source, calls };
}

const brief = () => screen.getByLabelText("Assignment brief");
const type = (text: string) => fireEvent.change(brief(), { target: { value: text } });
const breakItDown = () => fireEvent.click(screen.getByRole("button", { name: "Break it down" }));

describe("brief entry", () => {
  it("shows brief entry with no save indicator when nothing is stored", () => {
    renderApp(<HomeRoute />);
    expect(screen.getByRole("heading", { level: 1, name: "Turn an assignment brief into small, doable steps." })).toBeInTheDocument();
    expect(screen.queryByText(/Saved in this browser/)).not.toBeInTheDocument();
  });

  it("an empty submit shows Error 01, makes no build call and focuses the text area", () => {
    const { source, calls } = stub("never");
    renderApp(<HomeRoute />, source);
    type("   ");
    breakItDown();
    expect(screen.getByText("Paste your brief first, so there’s something to break down.")).toBeInTheDocument();
    expect(brief()).toHaveAttribute("aria-invalid", "true");
    expect(brief()).toHaveAccessibleDescription("Paste your brief first, so there’s something to break down.");
    expect(brief()).toHaveFocus();
    expect(calls).toHaveLength(0);
  });

  it("restores the draft from storage", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, activeAssignmentId: null, assignments: [], briefDraft: { text: "Saved text", deadline: "2026-12-01T09:00" } }),
    );
    renderApp(<HomeRoute />);
    expect(brief()).toHaveValue("Saved text");
    expect(screen.getByLabelText(/Deadline/)).toHaveValue("2026-12-01T09:00");
  });

  it("hides Use a sample brief unless NEXT_PUBLIC_SHOW_SAMPLE_BRIEF is \"true\"", () => {
    for (const value of [undefined, "", "false", "1", "TRUE"]) {
      vi.stubEnv("NEXT_PUBLIC_SHOW_SAMPLE_BRIEF", value);
      const { unmount } = renderApp(<HomeRoute />);
      expect(screen.queryByRole("button", { name: "Use a sample brief" })).not.toBeInTheDocument();
      unmount();
    }
  });

  it("with the flag on, Use a sample brief fills the text area without submitting", () => {
    vi.stubEnv("NEXT_PUBLIC_SHOW_SAMPLE_BRIEF", "true");
    const { source, calls } = stub("never");
    renderApp(<HomeRoute />, source);
    fireEvent.click(screen.getByRole("button", { name: "Use a sample brief" }));
    expect(brief()).toHaveValue(sampleAssignment.brief);
    expect(calls).toHaveLength(0);
  });

  it("shows the disclosure line as plain text near Break it down, and no sample-only notice", () => {
    renderApp(<HomeRoute />);
    expect(
      screen.getByText(
        "To build your plan, your brief is sent to OpenAI. Your plan and progress stay in this browser. No account needed. Momentum counts anonymous usage, such as when a plan’s first step is started.",
      ),
    ).toBeVisible();
    expect(screen.queryByText(/This preview can only build the sample plan/)).not.toBeInTheDocument();
  });

  it("a 13,000-character paste is kept whole and shows the over-limit message straight away (H-02)", () => {
    const { source, calls } = stub("never");
    renderApp(<HomeRoute />, source);
    expect(brief()).not.toHaveAttribute("maxLength");
    const pasted = "a".repeat(12_991) + "Due Dec 4"; // 13,000 characters, the due date at the end
    type(pasted);
    expect(brief()).toHaveValue(pasted);
    expect(screen.getByText("13,000 of 12,000 characters")).toBeInTheDocument();
    const message = "Your brief is longer than 12,000 characters. Shorten it to build a plan.";
    expect(screen.getByText(message, { selector: "#brief-error" })).toBeInTheDocument();
    expect(brief()).toHaveAttribute("aria-invalid", "true");
    expect(within(screen.getByRole("main")).getByRole("status")).toHaveTextContent(message);
    breakItDown();
    expect(calls).toHaveLength(0);
    expect(brief()).toHaveValue(pasted);

    type("a".repeat(MAX_BRIEF_CHARS));
    expect(screen.queryByText(message, { selector: "#brief-error" })).not.toBeInTheDocument();
  });

  it("counts the brief as the server does, without leading and trailing whitespace", () => {
    const { source, calls } = stub("never");
    renderApp(<HomeRoute />, source);
    type("a".repeat(MAX_BRIEF_CHARS) + "   \n");
    expect(screen.getByText("12,000 of 12,000 characters")).toBeInTheDocument();
    expect(screen.queryByText(/longer than 12,000/)).not.toBeInTheDocument();
    breakItDown();
    expect(calls).toHaveLength(1);
  });

  it("shows a quiet character count only within 10% of the limit, linked to the field", () => {
    renderApp(<HomeRoute />);
    type("a".repeat(BRIEF_COUNT_FROM - 1));
    expect(screen.queryByText(/of 12,000 characters/)).not.toBeInTheDocument();
    expect(within(screen.getByRole("main")).getByRole("status")).toBeEmptyDOMElement();

    type("a".repeat(11_200));
    expect(screen.getByText("11,200 of 12,000 characters")).toBeInTheDocument();
    expect(brief()).toHaveAccessibleDescription("11,200 of 12,000 characters");
    // The live region says it once on crossing, and doesn't change with each keystroke.
    expect(within(screen.getByRole("main")).getByRole("status")).toHaveTextContent("Your brief is close to the 12,000-character limit.");
    type("a".repeat(11_201));
    expect(within(screen.getByRole("main")).getByRole("status")).toHaveTextContent("Your brief is close to the 12,000-character limit.");

    type("a".repeat(MAX_BRIEF_CHARS));
    expect(within(screen.getByRole("main")).getByRole("status")).toHaveTextContent("Your brief has reached the 12,000-character limit.");
  });

  it("a stored draft over the limit isn't sent; it shows an error and keeps the text", () => {
    const long = "a".repeat(MAX_BRIEF_CHARS + 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, activeAssignmentId: null, assignments: [], briefDraft: { text: long, deadline: "" } }));
    const { source, calls } = stub("never");
    renderApp(<HomeRoute />, source);
    breakItDown();
    expect(screen.getByText("Your brief is longer than 12,000 characters. Shorten it to build a plan.", { selector: "#brief-error" })).toBeInTheDocument();
    expect(brief()).toHaveValue(long);
    expect(calls).toHaveLength(0);
  });

  it("a built plan opens in review and goes to /plan, clearing the draft", async () => {
    renderApp(<HomeRoute />);
    type(sampleAssignment.brief);
    fireEvent.change(screen.getByLabelText(/Deadline/), { target: { value: "2026-12-10T09:30" } });
    breakItDown();
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/plan"));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.briefDraft).toBeUndefined();
    expect(stored.assignments[0]).toMatchObject({ status: "review", deadline: "2026-12-10T09:30" });
  });
});

describe("building and errors", () => {
  it("building shows one state with no counts", async () => {
    renderApp(<HomeRoute />, stub("never").source);
    type("Some brief");
    breakItDown();
    expect(await screen.findByRole("heading", { name: "Building your plan" })).toBeInTheDocument();
    expect(within(screen.getByRole("main")).getByRole("status")).toHaveTextContent("Working on it");
    expect(screen.getByRole("main").textContent).not.toMatch(/\d/);
  });

  it("Cancel aborts the build and goes back with the text kept", async () => {
    const { source, calls } = stub("never");
    renderApp(<HomeRoute />, source);
    type("Some brief");
    breakItDown();
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(calls[0].signal.aborted).toBe(true);
    expect(brief()).toHaveValue("Some brief");
    expect(brief()).toHaveFocus();
  });

  it("unreadable shows Error 02 with focus on its heading; Edit the brief keeps the text", async () => {
    renderApp(<HomeRoute />, stub({ ok: false, reason: "unreadable" }).source);
    type("Half a brief");
    breakItDown();
    const heading = await screen.findByRole("heading", { name: "We couldn’t find clear requirements in that text." });
    // Focus moves in an effect after the card renders, so wait for it rather than racing it.
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText("Your text is still here.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit the brief" }));
    expect(brief()).toHaveValue("Half a brief");
    expect(brief()).toHaveFocus();
  });

  it("failed shows Error 03; Try again builds again with the same input", async () => {
    const { source, calls } = stub({ ok: false, reason: "failed" });
    renderApp(<HomeRoute />, source);
    type("A brief");
    fireEvent.change(screen.getByLabelText(/Deadline/), { target: { value: "2026-12-04T17:00" } });
    breakItDown();
    expect(await screen.findByRole("heading", { name: "We couldn’t build your plan just now." })).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Try again" })));
    expect(calls).toHaveLength(2);
    expect(calls[1]).toMatchObject({ brief: "A brief", deadline: "2026-12-04T17:00" });
  });

  it("a 429 from /api/plan shows Error 03 with the rate-limit line, and doesn't retry on its own", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ reason: "rateLimited" }, { status: 429 }));
    renderApp(<HomeRoute />, apiPlanSource);
    type("A brief");
    breakItDown();
    const heading = await screen.findByRole("heading", { name: "We couldn’t build your plan just now." });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText("Too many plans were built from this network. Try again in about 10 minutes.")).toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong on our side/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit the brief" })).toBeInTheDocument();
    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Try again" })));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    fetchSpy.mockRestore();
  });

  it("a source that throws counts as failed", async () => {
    renderApp(<HomeRoute />, { build: () => Promise.reject(new Error("network")) });
    type("A brief");
    breakItDown();
    expect(await screen.findByRole("heading", { name: "We couldn’t build your plan just now." })).toBeInTheDocument();
  });
});

describe("/new (brief entry when assignments exist)", () => {
  const withAssignments = () =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, activeAssignmentId: "a1", assignments: [makeAssignment("a1", 3)] }));

  it("shows no back link on first run", () => {
    renderApp(<BriefFlow />);
    expect(screen.queryByRole("link", { name: "Back to your assignments" })).not.toBeInTheDocument();
  });

  it("shows Back to your assignments, which goes to / and keeps the draft typed just before", () => {
    withAssignments();
    renderApp(<BriefFlow />);
    const back = screen.getByRole("link", { name: "Back to your assignments" });
    expect(back).toHaveAttribute("href", "/");
    // Typed and left at once, before the delayed draft save would run.
    type("Half a brief");
    fireEvent.change(screen.getByLabelText(/Deadline/), { target: { value: "2026-12-10T09:30" } });
    fireEvent.click(back);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).briefDraft).toEqual({ text: "Half a brief", deadline: "2026-12-10T09:30" });
  });

  it("a built plan is added next to the others and goes to /plan", async () => {
    withAssignments();
    renderApp(<BriefFlow />);
    type(sampleAssignment.brief);
    breakItDown();
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/plan"));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.assignments).toHaveLength(2);
    expect(stored.activeAssignmentId).toBe(stored.assignments[1].id);
  });
});

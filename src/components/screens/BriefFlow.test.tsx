import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeRoute } from "@/components/screens/HomeRoute";
import { sampleAssignment } from "@/data/sample-assignment";
import { BRIEF_COUNT_FROM, MAX_BRIEF_CHARS } from "@/lib/brief-limits";
import type { BuildResult, PlanSource } from "@/lib/plan-source";
import { STORAGE_KEY } from "@/lib/storage";
import { router } from "@/test/navigation-mock";
import { renderApp } from "@/test/render-app";

vi.mock("next/navigation", () => import("@/test/navigation-mock"));

afterEach(() => {
  vi.clearAllMocks();
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

  it("Use a sample brief fills the text area without submitting", () => {
    const { source, calls } = stub("never");
    renderApp(<HomeRoute />, source);
    fireEvent.click(screen.getByRole("button", { name: "Use a sample brief" }));
    expect(brief()).toHaveValue(sampleAssignment.brief);
    expect(calls).toHaveLength(0);
  });

  it("shows the disclosure line as plain text near Break it down, and no sample-only notice", () => {
    renderApp(<HomeRoute />);
    expect(
      screen.getByText("To build your plan, your brief is sent to OpenAI. Your plan and progress stay in this browser. No account needed."),
    ).toBeVisible();
    expect(screen.queryByText(/This preview can only build the sample plan/)).not.toBeInTheDocument();
  });

  it("the text area stops at the limit", () => {
    renderApp(<HomeRoute />);
    expect(brief()).toHaveAttribute("maxLength", String(MAX_BRIEF_CHARS));
  });

  it("shows a quiet character count only within 10% of the limit, linked to the field", () => {
    renderApp(<HomeRoute />);
    type("a".repeat(BRIEF_COUNT_FROM - 1));
    expect(screen.queryByText(/of 12,000 characters/)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    type("a".repeat(11_200));
    expect(screen.getByText("11,200 of 12,000 characters")).toBeInTheDocument();
    expect(brief()).toHaveAccessibleDescription("11,200 of 12,000 characters");
    // The live region says it once on crossing, and doesn't change with each keystroke.
    expect(screen.getByRole("status")).toHaveTextContent("Your brief is close to the 12,000-character limit.");
    type("a".repeat(11_201));
    expect(screen.getByRole("status")).toHaveTextContent("Your brief is close to the 12,000-character limit.");

    type("a".repeat(MAX_BRIEF_CHARS));
    expect(screen.getByRole("status")).toHaveTextContent("Your brief has reached the 12,000-character limit.");
  });

  it("a stored draft over the limit isn't sent; it shows an error and keeps the text", () => {
    const long = "a".repeat(MAX_BRIEF_CHARS + 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, activeAssignmentId: null, assignments: [], briefDraft: { text: long, deadline: "" } }));
    const { source, calls } = stub("never");
    renderApp(<HomeRoute />, source);
    breakItDown();
    expect(screen.getByText("Your brief is longer than 12,000 characters. Shorten it to build a plan.")).toBeInTheDocument();
    expect(brief()).toHaveValue(long);
    expect(calls).toHaveLength(0);
  });

  it("a built plan opens in review and goes to /plan, clearing the draft", async () => {
    renderApp(<HomeRoute />);
    type(sampleAssignment.brief);
    fireEvent.change(screen.getByLabelText(/Deadline/), { target: { value: "2026-12-10T09:30" } });
    breakItDown();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/plan"));
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
    expect(screen.getByRole("status")).toHaveTextContent("Working on it");
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
    expect(heading).toHaveFocus();
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

  it("a source that throws counts as failed", async () => {
    renderApp(<HomeRoute />, { build: () => Promise.reject(new Error("network")) });
    type("A brief");
    breakItDown();
    expect(await screen.findByRole("heading", { name: "We couldn’t build your plan just now." })).toBeInTheDocument();
  });
});

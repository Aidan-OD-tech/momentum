import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MomentumProvider, useMomentum, useMomentumData, WhenLoaded } from "@/lib/momentum-store";
import { STORAGE_KEY } from "@/lib/storage";
import { makeData } from "@/test/fixtures";

function Probe() {
  const { saveStatus, assignment, act: apply } = useMomentum();
  return (
    <>
      <p>status: {saveStatus}</p>
      <p>step 1: {assignment.steps[0].status}</p>
      <button onClick={() => apply({ type: "openStep", n: 1 })}>open</button>
    </>
  );
}

function EmptyProbe() {
  const { assignment, saveStatus } = useMomentumData();
  return <p>assignment: {assignment ? assignment.id : "none"}, status: {saveStatus}</p>;
}

const renderStore = () =>
  render(
    <MomentumProvider>
      <WhenLoaded>
        <Probe />
      </WhenLoaded>
    </MomentumProvider>,
  );

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("MomentumProvider", () => {
  it("starts empty on first run and writes nothing until something changes", () => {
    render(
      <MomentumProvider>
        <WhenLoaded>
          <EmptyProbe />
        </WhenLoaded>
      </MomentumProvider>,
    );
    expect(screen.getByText("assignment: none, status: hidden")).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("stays hidden on a return visit until something is written", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeData()));
    renderStore();
    expect(screen.getByText("status: hidden")).toBeInTheDocument();
    act(() => screen.getByRole("button", { name: "open" }).click());
    expect(screen.getByText("status: saved")).toBeInTheDocument();
  });

  describe("when another tab writes", () => {
    // What the browser does in this tab after another tab's setItem: the key, and the stored value.
    function otherTabWrites(value: string) {
      localStorage.setItem(STORAGE_KEY, value);
      act(() => {
        window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: value }));
      });
    }

    function withNote(note: string) {
      const data = makeData();
      data.assignments[0].steps[0] = { ...data.assignments[0].steps[0], status: "inProgress", note };
      return JSON.stringify(data);
    }

    function NoteProbe() {
      const { assignment, saveStatus, act: apply } = useMomentum();
      return (
        <>
          <p>note: {assignment.steps[0].note || "none"}</p>
          <p>status: {saveStatus}</p>
          <button onClick={() => apply({ type: "completeStep", n: 1 })}>complete</button>
        </>
      );
    }

    const renderNoteStore = () =>
      render(
        <MomentumProvider>
          <WhenLoaded>
            <NoteProbe />
          </WhenLoaded>
        </MomentumProvider>,
      );

    const storedStep1 = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!).assignments[0].steps[0];

    it("takes the other tab's data", () => {
      localStorage.setItem(STORAGE_KEY, withNote(""));
      renderNoteStore();
      expect(screen.getByText("note: none")).toBeInTheDocument();
      otherTabWrites(withNote("Written in tab A"));
      expect(screen.getByText("note: Written in tab A")).toBeInTheDocument();
    });

    it("keeps the other tab's note when this tab writes next (H-01)", () => {
      localStorage.setItem(STORAGE_KEY, withNote(""));
      renderNoteStore();
      otherTabWrites(withNote("Written in tab A"));
      act(() => screen.getByRole("button", { name: "complete" }).click());
      expect(storedStep1()).toMatchObject({ status: "done", note: "Written in tab A" });
    });

    it("ignores other keys", () => {
      localStorage.setItem(STORAGE_KEY, withNote(""));
      renderNoteStore();
      act(() => {
        window.dispatchEvent(new StorageEvent("storage", { key: "something-else", newValue: "x" }));
      });
      expect(screen.getByText("status: hidden")).toBeInTheDocument();
    });

    it("when the other tab's value is unreadable: shows failed and never writes over it", () => {
      localStorage.setItem(STORAGE_KEY, withNote("Kept on screen"));
      renderNoteStore();
      otherTabWrites("{not json");
      expect(screen.getByText("status: failed")).toBeInTheDocument();
      expect(screen.getByText("note: Kept on screen")).toBeInTheDocument();
      act(() => screen.getByRole("button", { name: "complete" }).click());
      expect(localStorage.getItem(STORAGE_KEY)).toBe("{not json");
      expect(screen.getByText("status: failed")).toBeInTheDocument();
    });
  });

  it("when setItem fails: shows failed and keeps working in memory", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeData()));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    renderStore();
    act(() => screen.getByRole("button", { name: "open" }).click());
    expect(screen.getByText("step 1: inProgress")).toBeInTheDocument();
    expect(screen.getByText("status: failed")).toBeInTheDocument();
  });
});

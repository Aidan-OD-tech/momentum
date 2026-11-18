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

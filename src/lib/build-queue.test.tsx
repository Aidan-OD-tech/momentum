import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSamplePlan } from "@/data/sample-assignment";
import { BuildQueueProvider, useBuildQueue, type QueueBrief } from "@/lib/build-queue";
import { MomentumProvider, useMomentumData, WhenLoaded } from "@/lib/momentum-store";
import type { BuildResult, PlanSource } from "@/lib/plan-source";
import { STORAGE_KEY } from "@/lib/storage";
import type { MomentumData } from "@/lib/types";
import { makeAssignment } from "@/test/fixtures";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

// A source whose requests stay out until the test answers them, so the test controls the order.
function controlledSource() {
  const calls: { brief: string; signal: AbortSignal; answer: (result: BuildResult) => Promise<void> }[] = [];
  const source: PlanSource = {
    build: (input, signal) =>
      new Promise((resolve) => {
        calls.push({
          brief: input.brief,
          signal,
          // Answers the request and lets the queue react, inside act().
          answer: (result) => act(async () => resolve(result)),
        });
      }),
  };
  return { source, calls };
}

const plan = (title: string): BuildResult => ({ ok: true, plan: { ...createSamplePlan(), title } });
const BRIEFS: QueueBrief[] = [1, 2, 3].map((n) => ({ id: `d${n}`, text: `Brief text ${n}`, deadline: "", number: n }));

function storeDrafts() {
  const data: MomentumData = {
    version: 1,
    activeAssignmentId: "open",
    assignments: [],
    briefDrafts: BRIEFS.map(({ id, text, deadline }) => ({ id, text, deadline })),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const stored = (): MomentumData => JSON.parse(localStorage.getItem(STORAGE_KEY)!);

// What the browser does in this tab after another tab's setItem.
function otherTabWrites(value: string) {
  localStorage.setItem(STORAGE_KEY, value);
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: value }));
  });
}

function Probe({ source }: { source: PlanSource }) {
  const queue = useBuildQueue();
  const { data } = useMomentumData();
  return (
    <>
      <p>items: {queue.items.map((item) => `${item.number}:${item.state}${item.title ? `:${item.title}` : ""}`).join(" ")}</p>
      <p>running: {String(queue.running)}</p>
      <p>rate limited: {String(queue.rateLimited)}</p>
      <p>assignments: {data.assignments.length}</p>
      <button onClick={() => queue.start(BRIEFS, source)}>start</button>
      <button onClick={() => queue.stopAfterCurrent()}>stop</button>
      <button onClick={() => queue.retry("d2")}>retry 2</button>
    </>
  );
}

function renderQueue(source: PlanSource) {
  storeDrafts();
  return render(
    <MomentumProvider>
      <BuildQueueProvider>
        <WhenLoaded>
          <Probe source={source} />
        </WhenLoaded>
      </BuildQueueProvider>
    </MomentumProvider>,
  );
}

const click = (name: string) => act(() => screen.getByRole("button", { name }).click());
const items = () => screen.getByText(/^items:/).textContent;

describe("build queue", () => {
  it("sends one request at a time, in card order, saving each plan as it arrives", async () => {
    const { source, calls } = controlledSource();
    renderQueue(source);
    click("start");
    expect(calls.map((c) => c.brief)).toEqual(["Brief text 1"]);
    expect(items()).toBe("items: 1:building 2:waiting 3:waiting");

    await calls[0].answer(plan("Plan one"));
    // The second starts only after the first came back, and the first is already stored.
    expect(calls.map((c) => c.brief)).toEqual(["Brief text 1", "Brief text 2"]);
    expect(stored().assignments.map((a) => a.title)).toEqual(["Plan one"]);
    expect(stored().briefDrafts!.map((d) => d.id)).toEqual(["d2", "d3"]);
    // It doesn't open the new plan.
    expect(stored().activeAssignmentId).toBe("open");

    await calls[1].answer(plan("Plan two"));
    await calls[2].answer(plan("Plan three"));
    expect(items()).toBe("items: 1:ready:Plan one 2:ready:Plan two 3:ready:Plan three");
    expect(screen.getByText("running: false")).toBeInTheDocument();
    expect(stored().assignments.every((a) => a.status === "review")).toBe(true);
    expect(stored().briefDrafts).toBeUndefined();
  });

  it("a failure in the middle keeps that draft and goes on with the rest", async () => {
    const { source, calls } = controlledSource();
    renderQueue(source);
    click("start");
    await calls[0].answer(plan("Plan one"));
    await calls[1].answer({ ok: false, reason: "unreadable" });
    expect(calls).toHaveLength(3);
    await calls[2].answer(plan("Plan three"));
    expect(items()).toBe("items: 1:ready:Plan one 2:failed 3:ready:Plan three");
    expect(stored().briefDrafts).toEqual([{ id: "d2", text: "Brief text 2", deadline: "" }]);
  });

  it("a 429 stops the queue: this brief and the later ones wait again, with no retry on its own", async () => {
    const { source, calls } = controlledSource();
    renderQueue(source);
    click("start");
    await calls[0].answer(plan("Plan one"));
    await calls[1].answer({ ok: false, reason: "rateLimited" });
    expect(items()).toBe("items: 1:ready:Plan one 2:waiting 3:waiting");
    expect(screen.getByText("running: false")).toBeInTheDocument();
    expect(screen.getByText("rate limited: true")).toBeInTheDocument();
    expect(calls).toHaveLength(2);
    expect(stored().briefDrafts!.map((d) => d.id)).toEqual(["d2", "d3"]);
  });

  it("Stop after this one finishes the current request and leaves the rest as drafts", async () => {
    const { source, calls } = controlledSource();
    renderQueue(source);
    click("start");
    click("stop");
    expect(screen.getByText("running: true")).toBeInTheDocument();
    await calls[0].answer(plan("Plan one"));
    expect(calls).toHaveLength(1);
    expect(items()).toBe("items: 1:ready:Plan one 2:waiting 3:waiting");
    expect(screen.getByText("running: false")).toBeInTheDocument();
    expect(stored().briefDrafts!.map((d) => d.id)).toEqual(["d2", "d3"]);
  });

  it("Try again builds the brief again after the others", async () => {
    const { source, calls } = controlledSource();
    renderQueue(source);
    click("start");
    await calls[0].answer(plan("Plan one"));
    await calls[1].answer({ ok: false, reason: "failed" });
    click("retry 2");
    // Brief 3 is still first in line.
    await calls[2].answer(plan("Plan three"));
    expect(calls.map((c) => c.brief)).toEqual(["Brief text 1", "Brief text 2", "Brief text 3", "Brief text 2"]);
    await calls[3].answer(plan("Plan two"));
    expect(items()).toBe("items: 1:ready:Plan one 2:ready:Plan two 3:ready:Plan three");
  });

  it("Try again after the run ended starts it again", async () => {
    const { source, calls } = controlledSource();
    renderQueue(source);
    click("start");
    await calls[0].answer(plan("Plan one"));
    await calls[1].answer({ ok: false, reason: "failed" });
    await calls[2].answer(plan("Plan three"));
    expect(screen.getByText("running: false")).toBeInTheDocument();
    click("retry 2");
    expect(calls).toHaveLength(4);
    await calls[3].answer(plan("Plan two"));
    expect(items()).toContain("2:ready:Plan two");
  });

  it("a plan whose write failed is never ready: it stays in memory this visit", async () => {
    const { source, calls } = controlledSource();
    renderQueue(source);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    click("start");
    await calls[0].answer(plan("Plan one"));
    expect(items()).toMatch(/^items: 1:notSaved:Plan one/);
    expect(screen.getByText("assignments: 1")).toBeInTheDocument();
    vi.restoreAllMocks();
    expect(stored().assignments).toHaveLength(0);
    expect(stored().briefDrafts).toHaveLength(3);
  });

  it("skips a brief another tab has already built (risk 5a)", async () => {
    const { source, calls } = controlledSource();
    renderQueue(source);
    click("start");
    // Meanwhile another tab builds brief 2: its draft goes and a plan with its text is stored.
    const other = stored();
    other.briefDrafts = other.briefDrafts!.filter((d) => d.id !== "d2");
    other.assignments.push({ ...makeAssignment("other", 1), status: "review", brief: "Brief text 2" });
    otherTabWrites(JSON.stringify(other));
    await calls[0].answer(plan("Plan one"));
    expect(items()).toBe("items: 1:ready:Plan one 2:elsewhere 3:building");
    expect(calls.map((c) => c.brief)).toEqual(["Brief text 1", "Brief text 3"]);
  });

  it("still builds a brief whose draft another tab removed without building it", async () => {
    const { source, calls } = controlledSource();
    renderQueue(source);
    click("start");
    const other = stored();
    other.briefDrafts = other.briefDrafts!.filter((d) => d.id !== "d2");
    otherTabWrites(JSON.stringify(other));
    await calls[0].answer(plan("Plan one"));
    expect(calls.map((c) => c.brief)).toEqual(["Brief text 1", "Brief text 2"]);
  });

  it("unmounting the provider aborts the request that is out", () => {
    const { source, calls } = controlledSource();
    const { unmount } = renderQueue(source);
    click("start");
    unmount();
    expect(calls[0].signal.aborted).toBe(true);
  });
});

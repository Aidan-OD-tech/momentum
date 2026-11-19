"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useMomentumStoreOrNull } from "@/lib/momentum-store";
import type { BuildResult, PlanSource } from "@/lib/plan-source";

// Builds one plan per brief for a week's upload (M7c): one request at a time, in card order, each plan
// saved as soon as it arrives. It lives above every screen (providers.tsx), so it keeps going while the
// student looks at the list. Its state is only in memory: a reload stops it, and the briefs not built
// yet are still drafts in storage.

// waiting: not sent yet. building: the request is out. ready: built and saved. notSaved: built, but the
// write failed, so the plan is only in memory this visit (never called "ready"). failed: not built.
export type QueueItemState = "waiting" | "building" | "ready" | "notSaved" | "failed";

export type QueueItem = {
  draftId: string;
  // "Brief N": the card's position when the upload started.
  number: number;
  brief: string;
  deadline: string;
  state: QueueItemState;
  // Set when failed: unreadable (no clear requirements) or failed (anything else).
  reason?: "unreadable" | "failed";
  // Set once built.
  title?: string;
  // Lower goes first. Try again gives the item a later turn, so it is built after the others.
  turn: number;
};

export type QueueBrief = { id: string; text: string; deadline: string; number: number };

type BuildQueue = {
  items: QueueItem[];
  // A request is out, or the next one is about to be sent.
  running: boolean;
  // Stop after this one was pressed and the current request hasn't come back yet.
  stopRequested: boolean;
  // The last run stopped on a 429. No automatic retry.
  rateLimited: boolean;
  start: (briefs: QueueBrief[], source: PlanSource) => void;
  stopAfterCurrent: () => void;
  retry: (draftId: string) => void;
  // Forgets a finished run, so brief entry shows again. Does nothing while running.
  clear: () => void;
};

const BuildQueueContext = createContext<BuildQueue | null>(null);

export function useBuildQueue(): BuildQueue {
  const queue = useContext(BuildQueueContext);
  if (!queue) throw new Error("useBuildQueue must be used inside <BuildQueueProvider>");
  return queue;
}

export function BuildQueueProvider({ children }: { children: React.ReactNode }) {
  const store = useMomentumStoreOrNull();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [running, setRunning] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  // Read by the running loop between awaits, so it always sees the latest values.
  const itemsRef = useRef<QueueItem[]>([]);
  const runningRef = useRef(false);
  const stopRef = useRef(false);
  const sourceRef = useRef<PlanSource | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const nextTurn = useRef(0);
  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  });

  // Unmounting (closing the app) stops the request that is out.
  useEffect(() => () => abortRef.current?.abort(), []);

  const update = useCallback((draftId: string, patch: Partial<QueueItem>) => {
    itemsRef.current = itemsRef.current.map((item) => (item.draftId === draftId ? { ...item, ...patch } : item));
    setItems(itemsRef.current);
  }, []);

  const run = useCallback(async () => {
    if (runningRef.current || !sourceRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setRateLimited(false);
    const controller = new AbortController();
    abortRef.current = controller;

    while (!stopRef.current) {
      const next = itemsRef.current.filter((item) => item.state === "waiting").sort((a, b) => a.turn - b.turn)[0];
      if (!next) break;
      update(next.draftId, { state: "building" });
      let result: BuildResult;
      try {
        result = await sourceRef.current.build({ brief: next.brief, deadline: next.deadline || undefined }, controller.signal);
      } catch {
        result = { ok: false, reason: "failed" };
      }
      if (controller.signal.aborted) return;

      if (result.ok) {
        const saved =
          storeRef.current?.act({
            type: "addPlanFromDraft",
            draftId: next.draftId,
            id: crypto.randomUUID(),
            plan: result.plan,
            brief: next.brief,
            deadlineOverride: next.deadline,
            at: new Date().toISOString(),
          }) ?? false;
        update(next.draftId, { state: saved ? "ready" : "notSaved", title: result.plan.title });
      } else if (result.reason === "rateLimited") {
        // Stop here. This brief and the later ones go back to waiting; their drafts are still stored.
        update(next.draftId, { state: "waiting" });
        setRateLimited(true);
        break;
      } else {
        // Keep its draft and go on with the next brief.
        update(next.draftId, { state: "failed", reason: result.reason });
      }
    }

    runningRef.current = false;
    stopRef.current = false;
    setRunning(false);
    setStopRequested(false);
  }, [update]);

  const start = useCallback(
    (briefs: QueueBrief[], source: PlanSource) => {
      if (runningRef.current) return;
      sourceRef.current = source;
      itemsRef.current = briefs.map((brief) => ({
        draftId: brief.id,
        number: brief.number,
        brief: brief.text,
        deadline: brief.deadline,
        state: "waiting",
        turn: nextTurn.current++,
      }));
      setItems(itemsRef.current);
      void run();
    },
    [run],
  );

  const stopAfterCurrent = useCallback(() => {
    if (!runningRef.current) return;
    stopRef.current = true;
    setStopRequested(true);
  }, []);

  const retry = useCallback(
    (draftId: string) => {
      update(draftId, { state: "waiting", reason: undefined, turn: nextTurn.current++ });
      void run();
    },
    [run, update],
  );

  const clear = useCallback(() => {
    if (runningRef.current) return;
    itemsRef.current = [];
    setItems([]);
    setRateLimited(false);
  }, []);

  const value = { items, running, stopRequested, rateLimited, start, stopAfterCurrent, retry, clear };
  return <BuildQueueContext.Provider value={value}>{children}</BuildQueueContext.Provider>;
}

"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { type SaveStatus, TopBar } from "@/components/TopBar";
import { createFirstRunData } from "@/data/sample-assignment";
import { type Action, getActiveAssignment, reducer } from "@/lib/reducer";
import { load, save } from "@/lib/storage";
import type { Assignment, MomentumData } from "@/lib/types";

type MomentumStore = {
  data: MomentumData;
  assignment: Assignment;
  saveStatus: SaveStatus;
  // True only right after a confirmed Finish for now. Kept in memory, so a reload clears it.
  progressSaved: boolean;
  // Applies an action and writes the result. Returns true when the write succeeded.
  act: (action: Action) => boolean;
  // Writes the current data again (used by Finish for now on step complete). Returns true on success.
  saveNow: () => boolean;
  markProgressSaved: () => void;
};

const MomentumContext = createContext<MomentumStore | null>(null);

export function useMomentum(): MomentumStore {
  const store = useContext(MomentumContext);
  if (!store) throw new Error("useMomentum must be used inside <MomentumProvider>");
  return store;
}

// Holds Momentum's data for the whole app and keeps it in local storage.
// The data is null until storage has been read in the browser, so the server render never depends on it.
export function MomentumProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MomentumData | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("hidden");
  const [progressSaved, setProgressSaved] = useState(false);
  // The latest data, readable synchronously by act() between renders.
  const dataRef = useRef<MomentumData | null>(null);
  // False when storage couldn't be read or backed up: work in memory and never write this session.
  const canWrite = useRef(true);

  const write = useCallback((next: MomentumData): boolean => {
    const ok = canWrite.current && save(next);
    setSaveStatus(ok ? "saved" : "failed");
    return ok;
  }, []);

  useEffect(() => {
    const result = load();
    canWrite.current = result.ok;
    // First run (or nothing readable): start with the sample assignment. M3 replaces this with brief entry.
    const initial = result.data ?? createFirstRunData();
    dataRef.current = initial;
    // Local storage exists only in the browser, so it is read here, after the first render, rather than
    // during render: that keeps the server HTML and the first client render identical (no hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(initial);
    if (!result.data) write(initial);
  }, [write]);

  const act = useCallback(
    (action: Action): boolean => {
      const current = dataRef.current;
      if (!current) return false;
      const next = reducer(current, action);
      // Nothing changed (e.g. reopening a step that is already in progress): no write, and "Progress saved" stays.
      if (next === current) return canWrite.current;
      setProgressSaved(false);
      dataRef.current = next;
      setData(next);
      return write(next);
    },
    [write],
  );

  const saveNow = useCallback(() => (dataRef.current ? write(dataRef.current) : false), [write]);
  const markProgressSaved = useCallback(() => setProgressSaved(true), []);

  const assignment = data ? getActiveAssignment(data) : undefined;
  const store = data && assignment ? { data, assignment, saveStatus, progressSaved, act, saveNow, markProgressSaved } : null;

  // Children always render, so the server still renders each page (and a page that calls notFound()
  // gets a real 404). Screens wait for the data inside <WhenLoaded>.
  return <MomentumContext.Provider value={store}>{children}</MomentumContext.Provider>;
}

// Shows a neutral loading state until local storage has been read in the browser. Every screen sits
// inside one, so nothing (no step, no "Saved in this browser") renders before the real data is known.
export function WhenLoaded({ children }: { children: React.ReactNode }) {
  const store = useContext(MomentumContext);
  if (store) return children;
  return (
    <>
      <TopBar mode="home" />
      <p role="status" className="sr-only">
        Loading
      </p>
    </>
  );
}

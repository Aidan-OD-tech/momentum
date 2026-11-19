"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { type SaveStatus, TopBar } from "@/components/TopBar";
import { type Action, getActiveAssignment, reducer } from "@/lib/reducer";
import { load, save, STORAGE_KEY } from "@/lib/storage";
import { useRedirect } from "@/lib/use-redirect";
import type { Assignment, MomentumData } from "@/lib/types";

type MomentumStore = {
  data: MomentumData;
  // The open assignment, or undefined when there is none (brief entry).
  assignment: Assignment | undefined;
  saveStatus: SaveStatus;
  // True only right after a confirmed Finish for now. Kept in memory, so a reload clears it.
  progressSaved: boolean;
  // The assignment whose review was just finished (confirmed write), for the home list's one-time line.
  // In memory like progressSaved: a reload or the next change clears it. Never stored.
  justFinishedId: string | null;
  // Applies an action and writes the result. Returns true when the write succeeded.
  act: (action: Action) => boolean;
  // Writes the current data again (used by Finish for now on step complete). Returns true on success.
  saveNow: () => boolean;
  markProgressSaved: () => void;
  markJustFinished: (id: string) => void;
};

const MomentumContext = createContext<MomentumStore | null>(null);

// The store, once local storage has been read. Use inside <WhenLoaded>.
export function useMomentumData(): MomentumStore {
  const store = useContext(MomentumContext);
  if (!store) throw new Error("useMomentumData must be used inside <WhenLoaded>");
  return store;
}

// The store, or null while local storage hasn't been read yet. For app-wide providers that mount
// before the data is known (the build queue); screens use useMomentumData.
export function useMomentumStoreOrNull(): MomentumStore | null {
  return useContext(MomentumContext);
}

// The store for screens that need an open assignment (working step, final check, review, home).
// Their pages wrap them in <WhenStarted>, which guarantees one.
export function useMomentum(): MomentumStore & { assignment: Assignment } {
  const store = useMomentumData();
  const { assignment } = store;
  if (!assignment) throw new Error("useMomentum needs an open assignment; wrap the screen in <WhenStarted>");
  return { ...store, assignment };
}

const EMPTY_DATA: MomentumData = { version: 1, activeAssignmentId: null, assignments: [] };

// Holds Momentum's data for the whole app and keeps it in local storage.
// The data is null until storage has been read in the browser, so the server render never depends on it.
export function MomentumProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MomentumData | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("hidden");
  const [progressSaved, setProgressSaved] = useState(false);
  const [justFinishedId, setJustFinishedId] = useState<string | null>(null);
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
    // First run (or nothing readable): no assignment, so "/" shows brief entry. Nothing is written
    // until the student does something, so no save indicator shows yet.
    const initial = result.data ?? EMPTY_DATA;
    dataRef.current = initial;
    // Local storage exists only in the browser, so it is read here, after the first render, rather than
    // during render: that keeps the server HTML and the first client render identical (no hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(initial);
  }, []);

  // Another tab wrote (the storage event never fires in the tab that wrote). Take its data, so this
  // tab's next write doesn't put back an old copy over it. Screens whose route no longer fits the new
  // data follow their existing redirects.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      const result = load();
      if (!result.ok || (event.newValue !== null && !result.data)) {
        // Unreadable (load() has backed it up) or storage unusable: keep what's on screen, never write over it.
        canWrite.current = false;
        setSaveStatus("failed");
        return;
      }
      const incoming = result.data ?? EMPTY_DATA;
      // Two tabs can be open on different assignments. Keep this tab's open one while it still exists,
      // so this tab doesn't jump to the other tab's assignment. Writes are unchanged, so after a reload
      // whichever tab wrote last decides which assignment is open (docs/decisions.md, M7b).
      const mine = dataRef.current?.activeAssignmentId;
      const keepMine = Boolean(mine) && incoming.assignments.some((assignment) => assignment.id === mine);
      const next = keepMine ? { ...incoming, activeAssignmentId: mine! } : incoming;
      dataRef.current = next;
      setData(next);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const act = useCallback(
    (action: Action): boolean => {
      const current = dataRef.current;
      if (!current) return false;
      const next = reducer(current, action);
      // Nothing changed (e.g. reopening a step that is already in progress): no write, and "Progress saved" stays.
      if (next === current) return canWrite.current;
      setProgressSaved(false);
      setJustFinishedId(null);
      dataRef.current = next;
      setData(next);
      return write(next);
    },
    [write],
  );

  const saveNow = useCallback(() => (dataRef.current ? write(dataRef.current) : false), [write]);
  const markProgressSaved = useCallback(() => setProgressSaved(true), []);
  const markJustFinished = useCallback((id: string) => setJustFinishedId(id), []);

  const assignment = data ? getActiveAssignment(data) : undefined;
  const store = data
    ? { data, assignment, saveStatus, progressSaved, justFinishedId, act, saveNow, markProgressSaved, markJustFinished }
    : null;

  // Children always render, so the server still renders each page (and a page that calls notFound()
  // gets a real 404). Screens wait for the data inside <WhenLoaded>.
  return <MomentumContext.Provider value={store}>{children}</MomentumContext.Provider>;
}

// Shows a neutral loading state until local storage has been read in the browser. Every screen sits
// inside one, so nothing (no step, no "Saved in this browser") renders before the real data is known.
export function WhenLoaded({ children }: { children: React.ReactNode }) {
  const store = useContext(MomentumContext);
  if (store) return children;
  return <Loading />;
}

function Loading() {
  return (
    <>
      <TopBar mode="home" />
      <p role="status" className="sr-only">
        Loading
      </p>
    </>
  );
}

// For the screens of a started plan (/step/n, /step/n/done, /final, /review). With no open assignment,
// or a plan still in review, it sends the browser to "/", which shows brief entry or the home list.
export function WhenStarted({ children }: { children: React.ReactNode }) {
  const store = useContext(MomentumContext);
  const started = Boolean(store?.assignment && store.assignment.status !== "review");
  useRedirect(store && !started ? "/" : null);
  if (!store || !started) return <Loading />;
  return children;
}

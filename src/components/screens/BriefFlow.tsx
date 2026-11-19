"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorCard } from "@/components/ErrorCard";
import { BriefEntryScreen, type EntryFocus } from "@/components/screens/BriefEntryScreen";
import { BuildingScreen } from "@/components/screens/BuildingScreen";
import { BuildQueueScreen } from "@/components/screens/BuildQueueScreen";
import { TopBar } from "@/components/TopBar";
import { sampleAssignment } from "@/data/sample-assignment";
import { readBriefDrafts } from "@/lib/brief-drafts";
import { briefLength, MAX_BRIEF_CHARS, MAX_BRIEFS } from "@/lib/brief-limits";
import { useBuildQueue } from "@/lib/build-queue";
import { showSampleBrief } from "@/lib/flags";
import { useMomentumData } from "@/lib/momentum-store";
import { simulatedSource, usePlanSource, type BuildResult, type FailureReason } from "@/lib/plan-source";
import type { BriefDraftItem } from "@/lib/types";

// How long typing pauses before the drafts are written to storage.
const DRAFT_SAVE_DELAY_MS = 400;

type Phase = { name: "entry" } | { name: "building" } | { name: "error"; reason: FailureReason };

const emptyBrief = (): BriefDraftItem => ({ id: crypto.randomUUID(), text: "", deadline: "" });

// "/" on first run, and /new (`atNew`). While a week's plans are being built, and until the student
// leaves after the run, it shows the queue (M7-3). Otherwise brief entry. Opening it after a run has
// ended starts fresh: the briefs that weren't built are drafts again.
export function BriefFlow({ atNew = false }: { atNew?: boolean }) {
  const queue = useBuildQueue();
  const [showRun, setShowRun] = useState(queue.running);
  if (queue.items.length > 0 && (queue.running || showRun)) {
    return (
      <BuildQueueScreen
        onEditBriefs={() => {
          queue.clear();
          setShowRun(false);
        }}
      />
    );
  }
  return <BriefEntryFlow atNew={atNew} onQueueStarted={() => setShowRun(true)} />;
}

// Brief entry, and for a single brief: building and Errors 02 and 03. The briefs are kept as drafts in
// storage, so they survive a reload, a failed build, Cancel and "Back to your assignments". One brief
// with text builds as it always has (then /plan); two or more go to the build queue.
function BriefEntryFlow({ atNew, onQueueStarted }: { atNew: boolean; onQueueStarted: () => void }) {
  const { data, act } = useMomentumData();
  const router = useRouter();
  const source = usePlanSource();
  const queue = useBuildQueue();
  const [briefs, setBriefs] = useState<BriefDraftItem[]>(() => {
    const stored = readBriefDrafts(data);
    return stored.length > 0 ? stored : [emptyBrief()];
  });
  const [phase, setPhase] = useState<Phase>({ name: "entry" });
  const [emptyError, setEmptyError] = useState(false);
  // The last brief with text that was removed, for Undo (this visit only).
  const [removed, setRemoved] = useState<{ brief: BriefDraftItem; index: number } | null>(null);
  const [focus, setFocus] = useState<EntryFocus>({ target: "heading" });
  const [focusKey, setFocusKey] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const build = useRef<AbortController | null>(null);

  const saveDrafts = useCallback(
    (next: BriefDraftItem[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = null;
      act({ type: "setBriefDrafts", drafts: next });
    },
    [act],
  );

  // Save the drafts once typing pauses. A pending save is dropped when the screen goes away; leaving
  // and building save straight away instead.
  useEffect(() => {
    saveTimer.current = setTimeout(() => saveDrafts(briefs), DRAFT_SAVE_DELAY_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [briefs, saveDrafts]);

  // Leaving the screen stops a single build that is still running (a week's queue keeps going).
  useEffect(() => () => build.current?.abort(), []);

  function moveFocus(next: EntryFocus) {
    setFocus(next);
    setFocusKey((key) => key + 1);
  }

  function backToEntry(id: string) {
    setPhase({ name: "entry" });
    moveFocus({ target: "brief", id });
  }

  function change(id: string, patch: Partial<Pick<BriefDraftItem, "text" | "deadline">>) {
    const next = briefs.map((brief) => (brief.id === id ? { ...brief, ...patch } : brief));
    setBriefs(next);
    if (emptyError && next.some((brief) => brief.text.trim())) setEmptyError(false);
  }

  // A removed brief that can still be undone keeps its place among the 8, so Undo always fits and
  // the list never passes 8 (Aidan, M7c risk review, finding 3).
  const canAdd = briefs.length + (removed ? 1 : 0) < MAX_BRIEFS;

  function add() {
    if (!canAdd) return;
    const brief = emptyBrief();
    setBriefs([...briefs, brief]);
    moveFocus({ target: "brief", id: brief.id });
  }

  function remove(id: string) {
    const index = briefs.findIndex((brief) => brief.id === id);
    const brief = briefs[index];
    const next = briefs.filter((b) => b.id !== id);
    setBriefs(next);
    // A brief with words in it can be brought back; an empty one just goes.
    setRemoved(brief.text.trim() ? { brief, index } : null);
    // Focus goes to the card that took its place, or to Add another brief. With one brief left there
    // are no card headings, so focus goes to Add another brief.
    const following = next[index];
    moveFocus(next.length > 1 && following ? { target: "card", id: following.id } : { target: "add" });
  }

  function undoRemove() {
    if (!removed) return;
    const next = [...briefs];
    next.splice(Math.min(removed.index, next.length), 0, removed.brief);
    setBriefs(next);
    setRemoved(null);
    moveFocus({ target: "brief", id: removed.brief.id });
  }

  function fillSample() {
    const empty = briefs.find((brief) => !brief.text.trim());
    if (empty) {
      change(empty.id, { text: sampleAssignment.brief });
    } else if (canAdd) {
      setBriefs([...briefs, { ...emptyBrief(), text: sampleAssignment.brief }]);
    }
    setEmptyError(false);
  }

  async function buildOne(brief: BriefDraftItem, activeSource: typeof source) {
    const controller = new AbortController();
    build.current = controller;
    setPhase({ name: "building" });
    let result: BuildResult;
    try {
      result = await activeSource.build({ brief: brief.text, deadline: brief.deadline || undefined }, controller.signal);
    } catch {
      result = { ok: false, reason: "failed" };
    }
    if (controller.signal.aborted) return;

    if (result.ok) {
      act({ type: "createPlan", id: crypto.randomUUID(), plan: result.plan, brief: brief.text, deadlineOverride: brief.deadline, at: new Date().toISOString() });
      router.push("/plan");
    } else {
      setPhase({ name: "error", reason: result.reason });
    }
  }

  function submit() {
    const withText = briefs.filter((brief) => brief.text.trim());
    if (withText.length === 0) {
      // Error 01: nothing to send, so no request.
      setEmptyError(true);
      backToEntry(briefs[0].id);
      return;
    }
    const tooLong = withText.find((brief) => briefLength(brief.text) > MAX_BRIEF_CHARS);
    if (tooLong) {
      // Its over-limit message is already showing; this moves focus to it. Nothing is sent.
      backToEntry(tooLong.id);
      return;
    }
    setEmptyError(false);
    setRemoved(null);
    saveDrafts(briefs);

    // In development, "?simulate=" can stand in for the source (for screenshots). Never in production.
    const activeSource = simulatedSource(window.location.search) ?? source;
    if (withText.length === 1) {
      void buildOne(withText[0], activeSource);
      return;
    }
    // Brief N is the card's position on screen, empty cards included.
    queue.start(
      withText.map((brief) => ({ ...brief, number: briefs.indexOf(brief) + 1 })),
      activeSource,
    );
    onQueueStarted();
    if (!atNew) router.push("/new");
  }

  function cancel() {
    build.current?.abort();
    backToEntry(briefs.find((brief) => brief.text.trim())?.id ?? briefs[0].id);
  }

  if (phase.name === "building") return <BuildingScreen onCancel={cancel} />;

  if (phase.name === "error") {
    const built = briefs.find((brief) => brief.text.trim()) ?? briefs[0];
    const editBrief = { label: "Edit the brief", onClick: () => backToEntry(built.id) };
    const tryAgain = { label: "Try again", onClick: submit };
    return (
      <div className="flex min-h-screen flex-col">
        <TopBar mode="home" />
        <main className="flex flex-1 items-start justify-center bg-surface-subtle px-4 py-16">
          {phase.reason === "unreadable" ? (
            <ErrorCard
              heading="We couldn’t find clear requirements in that text."
              body="This usually happens when only part of the brief was pasted, or the text came from a scanned page."
              bullets={[
                "Paste the full instructions, including length, sources and due date",
                "If it’s a scan, type the main requirements in yourself",
              ]}
              primary={editBrief}
              secondary={tryAgain}
            />
          ) : (
            <ErrorCard
              heading="We couldn’t build your plan just now."
              body={
                phase.reason === "rateLimited"
                  ? // The route allows 12 plans per IP address in 10 minutes (and 100 an hour in all), so no
                    // promise of an exact wait. Wording approved by Aidan (decisions.md, M6, item 5).
                    "Too many plans were built from this network. Try again in about 10 minutes."
                  : "Something went wrong on our side, not with your brief. Try again in a moment."
              }
              primary={tryAgain}
              secondary={editBrief}
            />
          )}
        </main>
      </div>
    );
  }

  return (
    <BriefEntryScreen
      variant={atNew ? "week" : "first"}
      briefs={briefs}
      onChange={change}
      onAdd={add}
      canAdd={canAdd}
      onRemove={remove}
      removed={removed && { index: removed.index, number: removed.index + 1, onUndo: undoRemove }}
      // Saves the drafts now: a save still waiting for typing to pause would be dropped on leaving.
      onBack={data.assignments.length > 0 ? () => saveDrafts(briefs) : undefined}
      onUseSample={showSampleBrief() ? fillSample : undefined}
      onSubmit={submit}
      emptyError={emptyError}
      focus={focus}
      focusKey={focusKey}
    />
  );
}

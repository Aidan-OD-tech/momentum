"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorCard } from "@/components/ErrorCard";
import { BriefEntryScreen } from "@/components/screens/BriefEntryScreen";
import { BuildingScreen } from "@/components/screens/BuildingScreen";
import { TopBar } from "@/components/TopBar";
import { sampleAssignment } from "@/data/sample-assignment";
import { briefLength, MAX_BRIEF_CHARS } from "@/lib/brief-limits";
import { showSampleBrief } from "@/lib/flags";
import { useMomentumData } from "@/lib/momentum-store";
import { simulatedSource, usePlanSource, type BuildResult, type FailureReason } from "@/lib/plan-source";

// How long typing pauses before the draft is written to storage.
const DRAFT_SAVE_DELAY_MS = 400;

type Phase =
  | { name: "entry"; focus: "heading" | "brief" }
  | { name: "building" }
  | { name: "error"; reason: FailureReason };

// "/" with no open assignment: brief entry, building, and Errors 02 and 03. The brief and deadline are
// kept as a draft in storage, so they survive a reload, a failed build and Cancel. When a plan is
// created, the store opens it in review and "/" sends the browser to /plan.
export function BriefFlow() {
  const { data, act } = useMomentumData();
  const source = usePlanSource();
  const [text, setText] = useState(data.briefDraft?.text ?? "");
  const [deadline, setDeadline] = useState(data.briefDraft?.deadline ?? "");
  const [phase, setPhase] = useState<Phase>({ name: "entry", focus: "heading" });
  const [entryError, setEntryError] = useState<"empty" | "tooLong" | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const build = useRef<AbortController | null>(null);

  const saveDraft = useCallback(
    (nextText: string, nextDeadline: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = null;
      act({ type: "setBriefDraft", draft: { text: nextText, deadline: nextDeadline } });
    },
    [act],
  );

  // Save the draft once typing pauses. A pending save is dropped when the screen goes away.
  useEffect(() => {
    saveTimer.current = setTimeout(() => saveDraft(text, deadline), DRAFT_SAVE_DELAY_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [text, deadline, saveDraft]);

  // Leaving the screen stops a build that is still running.
  useEffect(() => () => build.current?.abort(), []);

  function backToEntry() {
    setPhase({ name: "entry", focus: "brief" });
    setFocusKey((key) => key + 1);
  }

  async function submit() {
    if (!text.trim()) {
      // Error 01: nothing to send, so no request.
      setEntryError("empty");
      backToEntry();
      return;
    }
    if (briefLength(text) > MAX_BRIEF_CHARS) {
      // The over-limit message is already showing; this moves focus back to the brief.
      setEntryError("tooLong");
      backToEntry();
      return;
    }
    setEntryError(null);
    saveDraft(text, deadline);

    const controller = new AbortController();
    build.current = controller;
    setPhase({ name: "building" });
    // In development, "?simulate=" can stand in for the source (for screenshots). Never in production.
    const activeSource = simulatedSource(window.location.search) ?? source;
    let result: BuildResult;
    try {
      result = await activeSource.build({ brief: text, deadline: deadline || undefined }, controller.signal);
    } catch {
      result = { ok: false, reason: "failed" };
    }
    if (controller.signal.aborted) return;

    if (result.ok) {
      act({ type: "createPlan", id: crypto.randomUUID(), plan: result.plan, brief: text, deadlineOverride: deadline, at: new Date().toISOString() });
    } else {
      setPhase({ name: "error", reason: result.reason });
    }
  }

  function cancel() {
    build.current?.abort();
    backToEntry();
  }

  if (phase.name === "building") return <BuildingScreen onCancel={cancel} />;

  if (phase.name === "error") {
    const editBrief = { label: "Edit the brief", onClick: backToEntry };
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
                  ? // The route allows 5 plans per IP address in 10 minutes (and 100 an hour in all), so no
                    // promise of an exact wait. Wording pending Aidan's approval (decisions.md, M6).
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
      text={text}
      deadline={deadline}
      onTextChange={(next) => {
        setText(next);
        if (entryError === "empty" && next.trim()) setEntryError(null);
        if (entryError === "tooLong" && briefLength(next) <= MAX_BRIEF_CHARS) setEntryError(null);
      }}
      onDeadlineChange={setDeadline}
      onUseSample={
        showSampleBrief()
          ? () => {
              setText(sampleAssignment.brief);
              setEntryError(null);
            }
          : undefined
      }
      onSubmit={submit}
      // Over the limit shows the message straight away (a paste is no longer cut at the limit).
      error={entryError ?? (briefLength(text) > MAX_BRIEF_CHARS ? "tooLong" : null)}
      focus={phase.focus}
      focusKey={focusKey}
    />
  );
}

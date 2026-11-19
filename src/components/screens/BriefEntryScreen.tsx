"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { FieldError, TextArea } from "@/components/ui/text-field";
import { BRIEF_COUNT_FROM, briefLength, MAX_BRIEF_CHARS, MAX_BRIEFS } from "@/lib/brief-limits";
import type { BriefDraftItem } from "@/lib/types";
import { useFocusHeading } from "@/lib/use-focus-heading";

// Where focus goes after the next change: a brief's text area, a card's heading, or Add another brief.
export type EntryFocus = { target: "heading" } | { target: "brief"; id: string } | { target: "card"; id: string } | { target: "add" };

type BriefChange = Partial<Pick<BriefDraftItem, "text" | "deadline">>;

type BriefEntryScreenProps = {
  // "first": "/" on first run. "week": /new, adding a week's assignments (M7c).
  variant: "first" | "week";
  briefs: BriefDraftItem[];
  onChange: (id: string, change: BriefChange) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  // A brief with text that was just removed, shown in its place with Undo. Null when there is none.
  removed: { index: number; number: number; onUndo: () => void } | null;
  // Shows "Back to your assignments" (to "/") when given; called before leaving, e.g. to save the drafts.
  // Leave out on first run, when there is no list to go back to.
  onBack?: () => void;
  // Leave out to hide "Use a sample brief" (see showSampleBrief in src/lib/flags.ts).
  onUseSample?: () => void;
  onSubmit: () => void;
  // Error 01 (nothing pasted in any brief), shown on the first brief.
  emptyError: boolean;
  focus: EntryFocus;
  // Changes whenever focus should move again (e.g. a second empty submit).
  focusKey: number;
};

const count = (n: number) => n.toLocaleString("en-US");
const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`;

export const briefFieldId = (id: string) => `brief-${id}`;
const cardHeadingId = (id: string) => `brief-heading-${id}`;
const ADD_BRIEF_ID = "add-brief";

// Brief entry (R3 05, Error 01), for "/" on first run and /new. One brief looks as it always has;
// two or more are numbered cards, each with its own deadline, one plan per brief (M7-2).
// No save indicator before a plan exists (handoff decision 4).
export function BriefEntryScreen(props: BriefEntryScreenProps) {
  const { variant, briefs, removed, focus, focusKey } = props;
  const headingRef = useFocusHeading<HTMLHeadingElement>();
  const several = briefs.length > 1;

  useEffect(() => {
    if (focus.target === "heading") return;
    const id = focus.target === "add" ? ADD_BRIEF_ID : focus.target === "card" ? cardHeadingId(focus.id) : briefFieldId(focus.id);
    document.getElementById(id)?.focus();
  }, [focus, focusKey]);

  const withText = briefs.filter((brief) => brief.text.trim()).length;

  const fields = briefs.map((brief, index) => (
    <BriefField
      key={brief.id}
      brief={brief}
      number={index + 1}
      several={several}
      emptyError={props.emptyError && index === 0}
      onChange={(change) => props.onChange(brief.id, change)}
      onRemove={() => props.onRemove(brief.id)}
      onUseSample={index === 0 ? props.onUseSample : undefined}
    />
  ));
  if (removed) {
    // Shown where the brief was, so the student sees which one went.
    fields.splice(
      Math.min(removed.index, fields.length),
      0,
      <div key="removed" role="status" className="flex items-center justify-between gap-4 rounded-md bg-surface-subtle p-4">
        <p className="text-body text-text-primary">Brief {removed.number} removed.</p>
        <Button variant="tertiary" onClick={removed.onUndo}>
          Undo
        </Button>
      </div>,
    );
  }

  return (
    <>
      <TopBar mode="home" />
      <main className="mx-auto flex w-full max-w-home flex-col gap-8 px-4 pt-12 pb-16">
        {props.onBack && (
          <Link href="/" onClick={props.onBack} className="flex h-button-text items-center self-start rounded-sm text-link text-text-primary">
            Back to your assignments
          </Link>
        )}
        <div className="flex flex-col gap-3">
          <h1 ref={headingRef} tabIndex={-1} className="text-display text-text-primary focus-visible:shadow-none">
            {variant === "week" ? "Add this week’s assignments" : "Turn an assignment brief into small, doable steps."}
          </h1>
          <p className="text-body-l text-text-secondary">
            {variant === "week"
              ? "Paste each brief on its own. Momentum builds one plan per brief, one at a time, and you review each plan before you start."
              : "Paste your brief. Momentum suggests a plan of steps you can adjust. You do the work in your own tools."}
          </p>
        </div>

        <form
          noValidate
          className="flex flex-col gap-8"
          onSubmit={(event) => {
            event.preventDefault();
            props.onSubmit();
          }}
        >
          <div className="flex flex-col gap-4">{fields}</div>

          {briefs.length < MAX_BRIEFS ? (
            <Button id={ADD_BRIEF_ID} variant="secondary" className="self-start" onClick={props.onAdd}>
              Add another brief
            </Button>
          ) : (
            <p className="text-caption text-text-tertiary">You can add up to {MAX_BRIEFS} briefs at a time.</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 flex-col gap-2">
              {several && withText < briefs.length && (
                <p className="text-caption text-text-secondary">{plural(withText, "brief")} ready. Empty briefs are skipped.</p>
              )}
              {/* The AI disclosure (scope item 14), merged with the M3 "No account needed" line. The last
                  sentence covers the M5 usage event; its wording was approved by Aidan (decisions.md, M5). */}
              <p className="text-caption text-text-tertiary">
                To build your plan, your brief is sent to OpenAI. Your plan and progress stay in this browser. No account needed.
                Momentum counts anonymous usage, such as when a plan’s first step is started.
              </p>
            </div>
            <Button variant="primary" type="submit">
              {withText >= 2 ? `Build ${withText} plans` : "Break it down"}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}

type BriefFieldProps = {
  brief: BriefDraftItem;
  number: number;
  // Two or more briefs: a numbered card with Remove, and labels that name the brief.
  several: boolean;
  emptyError: boolean;
  onChange: (change: BriefChange) => void;
  onRemove: () => void;
  onUseSample?: () => void;
};

// One brief: its text (with the counter and over-limit message) and its optional deadline.
function BriefField({ brief, number, several, emptyError, onChange, onRemove, onUseSample }: BriefFieldProps) {
  const fieldId = briefFieldId(brief.id);
  const headingId = cardHeadingId(brief.id);
  const deadlineId = `deadline-${brief.id}`;
  // One brief keeps the ids it always had; in cards each id names its brief.
  const errorId = several ? `brief-error-${brief.id}` : "brief-error";
  const countId = several ? `brief-count-${brief.id}` : "brief-count";
  const length = briefLength(brief.text);
  const nearLimit = length >= BRIEF_COUNT_FROM;
  // Over the limit shows the message straight away (a paste is no longer cut at the limit).
  const error = emptyError ? "empty" : length > MAX_BRIEF_CHARS ? "tooLong" : null;
  const describedBy = [error && errorId, nearLimit && countId].filter(Boolean).join(" ") || undefined;

  const sample = onUseSample && (
    <Button variant="tertiary" onClick={onUseSample}>
      Use a sample brief
    </Button>
  );

  const fields = (
    <>
      <div className="flex flex-col gap-2">
        {!several && (
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={fieldId} className="text-body-strong text-text-primary">
              Assignment brief
            </label>
            {sample}
          </div>
        )}
        <TextArea
          id={fieldId}
          // In a card, the card's heading ("Brief 2") names the field.
          aria-labelledby={several ? headingId : undefined}
          // No maxLength: a longer paste is kept whole, so nothing at its end (often the due date) is
          // dropped unseen. The over-limit message below blocks the build until it's shortened (H-02).
          rows={several ? 8 : 11}
          value={brief.text}
          onChange={(event) => onChange({ text: event.target.value })}
          placeholder="Paste the full instructions: what to make, length, sources, format and due date."
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {error === "empty" && <FieldError id={errorId}>Paste your brief first, so there’s something to break down.</FieldError>}
        {error === "tooLong" && (
          // Development copy.
          <FieldError id={errorId}>Your brief is longer than {count(MAX_BRIEF_CHARS)} characters. Shorten it to build a plan.</FieldError>
        )}
        {nearLimit && (
          // Development copy. Read with the field (aria-describedby), not announced on every keystroke.
          <p id={countId} className="text-caption text-text-tertiary">
            {count(length)} of {count(MAX_BRIEF_CHARS)} characters
          </p>
        )}
        <LimitAnnouncement length={length} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={deadlineId} className="flex items-baseline gap-2">
          <span className="text-body-strong text-text-primary">
            Deadline
            {several && <span className="sr-only"> for brief {number}</span>}
          </span>
          <span className="text-caption text-text-tertiary">Optional</span>
        </label>
        {/* A native date and time field (scope decision). Blank keeps any deadline found in the brief. */}
        <input
          id={deadlineId}
          type="datetime-local"
          value={brief.deadline}
          onChange={(event) => onChange({ deadline: event.target.value })}
          className="h-button self-start rounded-sm border border-border-input bg-surface-page px-3 text-body-l text-text-primary focus:border-border-strong focus-visible:shadow-none"
        />
      </div>
    </>
  );

  if (!several) return <div className="flex flex-col gap-8">{fields}</div>;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6 rounded-lg border border-border-default p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={headingId} tabIndex={-1} className="text-body-strong text-text-primary focus-visible:shadow-none">
          Brief {number}
        </h2>
        <div className="flex gap-4">
          {sample}
          <Button variant="tertiary" aria-label={`Remove brief ${number}`} onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
      {fields}
    </section>
  );
}

// A polite live region whose text changes only when the brief crosses into "near the limit", reaches
// the limit or goes over it, so a screen reader hears it once at each point rather than on every keystroke.
function LimitAnnouncement({ length }: { length: number }) {
  let message = "";
  if (length > MAX_BRIEF_CHARS) message = `Your brief is longer than ${count(MAX_BRIEF_CHARS)} characters. Shorten it to build a plan.`;
  else if (length === MAX_BRIEF_CHARS) message = `Your brief has reached the ${count(MAX_BRIEF_CHARS)}-character limit.`;
  else if (length >= BRIEF_COUNT_FROM) message = `Your brief is close to the ${count(MAX_BRIEF_CHARS)}-character limit.`;
  return (
    <p role="status" className="sr-only">
      {message}
    </p>
  );
}

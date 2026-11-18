"use client";

import { useEffect, useRef } from "react";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { FieldError, TextArea } from "@/components/ui/text-field";
import { BRIEF_COUNT_FROM, MAX_BRIEF_CHARS } from "@/lib/brief-limits";
import { useFocusHeading } from "@/lib/use-focus-heading";

type BriefEntryScreenProps = {
  text: string;
  deadline: string;
  onTextChange: (text: string) => void;
  onDeadlineChange: (deadline: string) => void;
  // Leave out to hide "Use a sample brief" (see showSampleBrief in src/lib/flags.ts).
  onUseSample?: () => void;
  onSubmit: () => void;
  // Error 01: nothing pasted. tooLong: a draft saved before the limit existed is over it.
  error: "empty" | "tooLong" | null;
  // "brief" puts focus in the text area (Edit the brief, Cancel, Error 01); "heading" on a fresh visit.
  focus: "heading" | "brief";
  // Changes whenever focus should move again (e.g. a second empty submit).
  focusKey: number;
};

const count = (n: number) => n.toLocaleString("en-US");

// "/" with no open assignment: brief entry (R3 05, Error 01). No save indicator before a plan exists
// (handoff decision 4).
export function BriefEntryScreen(props: BriefEntryScreenProps) {
  const { text, deadline, error, focus, focusKey } = props;
  const headingRef = useFocusHeading<HTMLHeadingElement>();
  const briefRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focus === "brief") briefRef.current?.focus();
  }, [focus, focusKey]);

  const nearLimit = text.length >= BRIEF_COUNT_FROM;
  const describedBy = [error && "brief-error", nearLimit && "brief-count"].filter(Boolean).join(" ") || undefined;

  return (
    <>
      <TopBar mode="home" />
      <main className="mx-auto flex w-full max-w-home flex-col gap-8 px-4 pt-12 pb-16">
        <div className="flex flex-col gap-3">
          <h1 ref={headingRef} tabIndex={-1} className="text-display text-text-primary focus-visible:shadow-none">
            Turn an assignment brief into small, doable steps.
          </h1>
          <p className="text-body-l text-text-secondary">
            Paste your brief. Momentum suggests a plan of steps you can adjust. You do the work in your own tools.
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
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="brief" className="text-body-strong text-text-primary">
                Assignment brief
              </label>
              {props.onUseSample && (
                <Button variant="tertiary" onClick={props.onUseSample}>
                  Use a sample brief
                </Button>
              )}
            </div>
            <TextArea
              id="brief"
              ref={briefRef}
              rows={11}
              maxLength={MAX_BRIEF_CHARS}
              value={text}
              onChange={(event) => props.onTextChange(event.target.value)}
              placeholder="Paste the full instructions: what to make, length, sources, format and due date."
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
            />
            {error === "empty" && <FieldError id="brief-error">Paste your brief first, so there’s something to break down.</FieldError>}
            {error === "tooLong" && (
              // Development copy.
              <FieldError id="brief-error">
                Your brief is longer than {count(MAX_BRIEF_CHARS)} characters. Shorten it to build a plan.
              </FieldError>
            )}
            {nearLimit && (
              // Development copy. Read with the field (aria-describedby), not announced on every keystroke.
              <p id="brief-count" className="text-caption text-text-tertiary">
                {count(text.length)} of {count(MAX_BRIEF_CHARS)} characters
              </p>
            )}
            <LimitAnnouncement length={text.length} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="deadline" className="flex items-baseline gap-2">
              <span className="text-body-strong text-text-primary">Deadline</span>
              <span className="text-caption text-text-tertiary">Optional</span>
            </label>
            {/* A native date and time field (scope decision). Blank keeps any deadline found in the brief. */}
            <input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(event) => props.onDeadlineChange(event.target.value)}
              className="h-button self-start rounded-sm border border-border-input bg-surface-page px-3 text-body-l text-text-primary focus:border-border-strong focus-visible:shadow-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* The AI disclosure (scope item 14), merged with the M3 "No account needed" line. Development copy. */}
            <p className="flex-1 text-caption text-text-tertiary">
              To build your plan, your brief is sent to OpenAI. Your plan and progress stay in this browser. No account needed.
            </p>
            <Button variant="primary" type="submit">
              Break it down
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}

// A polite live region whose text changes only when the brief crosses into "near the limit" or reaches
// the limit, so a screen reader hears it once at each point rather than on every keystroke.
function LimitAnnouncement({ length }: { length: number }) {
  let message = "";
  if (length >= MAX_BRIEF_CHARS) message = `Your brief has reached the ${count(MAX_BRIEF_CHARS)}-character limit.`;
  else if (length >= BRIEF_COUNT_FROM) message = `Your brief is close to the ${count(MAX_BRIEF_CHARS)}-character limit.`;
  return (
    <p role="status" className="sr-only">
      {message}
    </p>
  );
}

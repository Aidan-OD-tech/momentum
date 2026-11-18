"use client";

import { useEffect, useRef } from "react";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { FieldError, TextArea } from "@/components/ui/text-field";
import { useFocusHeading } from "@/lib/use-focus-heading";

type BriefEntryScreenProps = {
  text: string;
  deadline: string;
  onTextChange: (text: string) => void;
  onDeadlineChange: (deadline: string) => void;
  onUseSample: () => void;
  onSubmit: () => void;
  // Error 01: the student pressed Break it down with nothing pasted.
  emptyError: boolean;
  // The M3-only notice when the sample source can't build from this text.
  sampleOnly: boolean;
  // "brief" puts focus in the text area (Edit the brief, Cancel, Error 01); "heading" on a fresh visit.
  focus: "heading" | "brief";
  // Changes whenever focus should move again (e.g. a second empty submit).
  focusKey: number;
};

// "/" with no open assignment: brief entry (R3 05, Error 01). No save indicator before a plan exists
// (handoff decision 4).
export function BriefEntryScreen(props: BriefEntryScreenProps) {
  const { text, deadline, emptyError, sampleOnly, focus, focusKey } = props;
  const headingRef = useFocusHeading<HTMLHeadingElement>();
  const briefRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focus === "brief") briefRef.current?.focus();
  }, [focus, focusKey]);

  const describedBy = [emptyError && "brief-error", sampleOnly && "brief-sample-only"].filter(Boolean).join(" ") || undefined;

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
              <Button variant="tertiary" onClick={props.onUseSample}>
                Use a sample brief
              </Button>
            </div>
            <TextArea
              id="brief"
              ref={briefRef}
              rows={11}
              value={text}
              onChange={(event) => props.onTextChange(event.target.value)}
              placeholder="Paste the full instructions: what to make, length, sources, format and due date."
              aria-invalid={emptyError || undefined}
              aria-describedby={describedBy}
            />
            {emptyError && <FieldError id="brief-error">Paste your brief first, so there’s something to break down.</FieldError>}
            {sampleOnly && (
              // TEMPORARY development copy (M3 only; remove in M4 with the sample source).
              <p id="brief-sample-only" role="status" className="text-body text-text-secondary">
                This preview can only build the sample plan. Plans from your own brief come in the next version.
              </p>
            )}
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
            <p className="text-caption text-text-tertiary">No account needed. Your plan stays in this browser.</p>
            <Button variant="primary" type="submit">
              Break it down
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}

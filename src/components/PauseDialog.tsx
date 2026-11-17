"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "radix-ui";

type PauseDialogProps = {
  stepNumber: number;
  // What the text area starts with: the unsaved draft if there is one, otherwise the saved note.
  initialText: string;
  // Called about 300 ms after typing stops, and again on close if typing hasn't been saved yet.
  onDraftChange: (text: string) => void;
  onFinish: (text: string) => void;
};

const DRAFT_DELAY_MS = 300;

// "Pause for later" and its dialog (Core 02, Core 03). Escape, the close button and Keep working
// all close it, keeping the typed draft and leaving the saved note alone. Radix returns focus to
// the Pause for later button.
export function PauseDialog(props: PauseDialogProps) {
  return (
    <Dialog>
      <DialogPrimitive.Trigger asChild>
        <Button variant="secondary">Pause for later</Button>
      </DialogPrimitive.Trigger>
      <DialogContent
        onOpenAutoFocus={(event) => {
          // Start in the note field rather than on the close button.
          event.preventDefault();
          document.getElementById("pause-note")?.focus();
        }}
      >
        <PauseForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

// Mounted only while the dialog is open, so it starts from initialText every time.
function PauseForm({ stepNumber, initialText, onDraftChange, onFinish }: PauseDialogProps) {
  const [text, setText] = useState(initialText);
  const pending = useRef<{ timer: ReturnType<typeof setTimeout>; text: string } | null>(null);
  // The latest onDraftChange, for the timer and the close-time flush below.
  const onDraftChangeRef = useRef(onDraftChange);
  useEffect(() => {
    onDraftChangeRef.current = onDraftChange;
  });

  // On close, save any draft still waiting for its delay.
  useEffect(
    () => () => {
      if (pending.current) {
        clearTimeout(pending.current.timer);
        onDraftChangeRef.current(pending.current.text);
      }
    },
    [],
  );

  function handleChange(next: string) {
    setText(next);
    if (pending.current) clearTimeout(pending.current.timer);
    const timer = setTimeout(() => {
      pending.current = null;
      onDraftChangeRef.current(next);
    }, DRAFT_DELAY_MS);
    pending.current = { timer, text: next };
  }

  function handleFinish() {
    // Finishing saves the note itself, so the waiting draft is dropped, not saved.
    if (pending.current) clearTimeout(pending.current.timer);
    pending.current = null;
    onFinish(text);
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        handleFinish();
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <DialogTitle className="text-heading-l text-text-primary">Where did you leave off?</DialogTitle>
          <DialogDescription className="text-body text-text-secondary">
            Step {stepNumber} stays in progress. Add a note for next time if it helps.
          </DialogDescription>
        </div>
        <DialogClose aria-label="Close" className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-secondary">
          <CloseIcon />
        </DialogClose>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="pause-note" className="flex items-baseline gap-2">
          <span className="text-body-strong text-text-primary">Note</span>
          <span className="text-caption text-text-tertiary">Optional</span>
        </label>
        {/* Text fields show focus with border/strong (handoff: "Focused or active input"), not the ring. */}
        <textarea
          id="pause-note"
          rows={3}
          value={text}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="For example: thesis drafted, still need the third outline point"
          className="w-full resize-y rounded-sm border border-border-input bg-surface-page px-3 py-2 text-body-l text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus-visible:shadow-none"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <DialogClose asChild>
          <Button variant="secondary">Keep working</Button>
        </DialogClose>
        <Button variant="primary" type="submit">
          Finish for now
        </Button>
      </div>
    </form>
  );
}

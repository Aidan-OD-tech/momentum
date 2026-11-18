"use client";

import { BriefRequirements } from "@/components/BriefRequirements";
import { BulletItem } from "@/components/BulletItem";
import { DoneWhen } from "@/components/DoneWhen";
import { PauseDialog } from "@/components/PauseDialog";
import { ReturnNote } from "@/components/ReturnNote";
import { Timer } from "@/components/Timer";
import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/lib/format";
import { useFocusHeading } from "@/lib/use-focus-heading";
import type { Requirement, Step } from "@/lib/types";

type WorkingStepProps = {
  step: Step;
  stepNumber: number;
  stepCount: number;
  requirements: Requirement[];
  onMarkComplete: () => void;
  onPauseDraftChange: (text: string) => void;
  onFinishForNow: (text: string) => void;
  onNoteHiddenChange: (hidden: boolean) => void;
  // On a done step: the step in progress to go back to, or null for home.
  backToStep: number | null;
  onBack: () => void;
};

// The main column of the working-step screen. A done step (opened from the rail or a URL) shows without
// Mark complete, Pause for later or the timer, and with one way back: to the step in progress, or home.
export function WorkingStep({
  step,
  stepNumber,
  stepCount,
  requirements,
  onMarkComplete,
  onPauseDraftChange,
  onFinishForNow,
  onNoteHiddenChange,
  backToStep,
  onBack,
}: WorkingStepProps) {
  const headingRef = useFocusHeading<HTMLHeadingElement>(stepNumber);
  const done = step.status === "done";

  return (
    <main className="flex w-full max-w-column flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-caption text-text-tertiary">
          Step {stepNumber} of {stepCount} · about {formatMinutes(step.estimateMin)} for the full step
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="text-display text-text-primary focus-visible:shadow-none">
          {step.title}
        </h1>
        {step.intro && <p className="text-body-l text-text-secondary">{step.intro}</p>}
      </header>

      {step.note && (
        <ReturnNote
          note={step.note}
          savedAt={step.noteSavedAt}
          variant={step.noteHidden ? "hidden" : "shown"}
          onHide={() => onNoteHiddenChange(true)}
          onShow={() => onNoteHiddenChange(false)}
        />
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-label text-text-secondary">What to do</h2>
        <ul role="list" className="flex flex-col gap-2">
          {step.whatToDo.map((item) => (
            <BulletItem key={item}>{item}</BulletItem>
          ))}
        </ul>
      </section>

      <DoneWhen criterion={step.doneWhen} />

      {done ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-body text-text-secondary">You marked this step done.</p>
          <Button variant="secondary" onClick={onBack}>
            {backToStep ? `Back to step ${backToStep}` : "Back to home"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={onMarkComplete}>
            Mark complete
          </Button>
          <PauseDialog
            stepNumber={stepNumber}
            initialText={step.pauseDraft ?? step.note}
            onDraftChange={onPauseDraftChange}
            onFinish={onFinishForNow}
          />
        </div>
      )}

      <div className="border-t border-border-default pt-4">
        <BriefRequirements requirements={requirements} />
      </div>

      {!done && (
        <div className="border-t border-border-default pt-4">
          {/* Keyed by step, so moving to another step starts with the timer off. */}
          <Timer key={step.id} minutes={step.estimateMin} />
        </div>
      )}
    </main>
  );
}

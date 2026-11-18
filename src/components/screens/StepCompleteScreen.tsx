"use client";

import { notFound, useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle } from "@/components/CheckCircle";
import { Progress } from "@/components/Progress";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { assignmentContext, doneWhenSentence, formatMinutes } from "@/lib/format";
import { useMomentum } from "@/lib/momentum-store";
import { allStepsDone, countDoneSteps, nextStepNumber } from "@/lib/step-state";
import { useFocusHeading } from "@/lib/use-focus-heading";
import { useRedirect } from "@/lib/use-redirect";

// /step/n/done: step complete (Core 09).
export function StepCompleteScreen({ n }: { n: number }) {
  const { assignment, saveStatus, act, saveNow, markProgressSaved } = useMomentum();
  const router = useRouter();
  const headingRef = useFocusHeading<HTMLHeadingElement>(n);
  const step = assignment.steps[n - 1];
  const nextN = nextStepNumber(assignment, n);
  // Set when this screen sends the student somewhere itself (Undo), so the check below doesn't redirect home.
  const [leaving, setLeaving] = useState(false);

  // Only for a done step with work left. When every step is done, the final check takes over.
  let redirectTo: string | null = null;
  if (leaving) redirectTo = null;
  else if (step && (step.status !== "done" || assignment.status === "completed")) redirectTo = "/";
  else if (step && allStepsDone(assignment)) redirectTo = "/final";
  useRedirect(redirectTo);

  if (!step) notFound();
  if (leaving || redirectTo || nextN === null) return null;
  const next = assignment.steps[nextN - 1];

  function finishForNow() {
    if (saveNow()) markProgressSaved();
    router.push("/");
  }

  function undo() {
    setLeaving(true);
    act({ type: "undo" });
    router.push(`/step/${n}`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar mode="session" context={assignmentContext(assignment)} saveStatus={saveStatus} />
      <main className="flex-1 bg-surface-subtle px-4 py-12">
        <div className="mx-auto flex w-full max-w-complete-card flex-col gap-6 rounded-lg border border-border-default bg-surface-page p-8">
          <CheckCircle />
          <div className="flex flex-col gap-2">
            <h1 ref={headingRef} tabIndex={-1} className="text-display text-text-primary focus-visible:shadow-none">
              Step {n} done.
            </h1>
            {step.completedSummary && <p className="text-body-l text-text-secondary">{step.completedSummary}</p>}
          </div>
          <Progress done={countDoneSteps(assignment)} total={assignment.steps.length} />

          <div className="flex flex-col gap-2 rounded-md bg-surface-subtle p-6">
            <p className="text-label text-text-secondary">
              Next up · Step {nextN} · about {formatMinutes(next.estimateMin)} for the full step
            </p>
            <h2 className="text-heading-m text-text-primary">{next.title}</h2>
            <p className="text-body text-text-secondary">{doneWhenSentence(next.doneWhen)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="primary" fullWidth onClick={() => router.push(`/step/${nextN}`)}>
              Continue to step {nextN}
            </Button>
            <Button variant="secondary" fullWidth onClick={finishForNow}>
              Finish for now
            </Button>
          </div>

          <p className="text-caption text-text-tertiary">Step {nextN} will be here when you come back.</p>
          {assignment.lastUndo?.stepId === step.id && (
            // As on the final check: the visible line tells a screen reader what Undo undoes.
            <div className="flex items-center justify-between gap-4">
              <p id="undo-description" className="text-caption text-text-tertiary">
                Step {n} is marked done.
              </p>
              <Button variant="tertiary" onClick={undo} aria-describedby="undo-description">
                Undo
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

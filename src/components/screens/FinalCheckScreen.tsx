"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle } from "@/components/CheckCircle";
import { SubmissionReminder } from "@/components/SubmissionReminder";
import { usePanel } from "@/components/SidePanel";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { assignmentContext } from "@/lib/format";
import { useMomentum } from "@/lib/momentum-store";
import { allStepsDone, substantiveFirst } from "@/lib/step-state";
import { useFocusHeading } from "@/lib/use-focus-heading";
import { useRedirect } from "@/lib/use-redirect";

// /final: the final requirements check (R3 01). Only while every step is done and the review isn't finished.
export function FinalCheckScreen() {
  const { assignment, saveStatus, act, markJustFinished } = useMomentum();
  const { openPanel } = usePanel();
  const router = useRouter();
  const headingRef = useFocusHeading<HTMLHeadingElement>();

  // Set when this screen sends the student somewhere itself (Undo, Finish review), so the check below
  // doesn't race it with a redirect home.
  const [leaving, setLeaving] = useState(false);
  const fits = assignment.status === "active" && allStepsDone(assignment);
  useRedirect(fits || leaving ? null : "/");
  if (!fits) return null;

  const checklist = substantiveFirst(assignment.requirements).filter((r) => r.kind !== "submission");
  const undoN = assignment.steps.findIndex((step) => step.id === assignment.lastUndo?.stepId) + 1;
  const stepCount = assignment.steps.length;

  function finishReview() {
    setLeaving(true);
    // The home list's completion line says the plan is kept, so it shows only after a confirmed write.
    if (act({ type: "finishReview", at: new Date().toISOString() })) markJustFinished(assignment.id);
    router.push("/");
  }

  // Aidan's decision, not yet drawn in Figma: undo the last completion from here.
  function undo() {
    setLeaving(true);
    act({ type: "undo" });
    router.push(`/step/${undoN}`);
  }

  return (
    <>
      <TopBar mode="session" context={assignmentContext(assignment)} saveStatus={saveStatus} />
      <main className="mx-auto flex w-full max-w-column flex-col gap-6 px-4 pt-12 pb-16">
        <div className="flex flex-col gap-4">
          <CheckCircle />
          <div className="flex flex-col gap-1">
            <h1 ref={headingRef} tabIndex={-1} className="text-display text-text-primary focus-visible:shadow-none">
              All {stepCount} {stepCount === 1 ? "step" : "steps"} done.
            </h1>
            <p className="text-body-l text-text-secondary">
              {[assignment.title, assignment.course].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <section aria-labelledby="final-check-heading" className="flex flex-col gap-6 rounded-lg border border-border-default p-6">
          <div className="flex flex-col gap-1">
            <h2 id="final-check-heading" className="text-heading-m text-text-primary">
              Before you submit, check your document against the brief
            </h2>
            <p className="text-body text-text-secondary">Tick these off yourself. Momentum can’t see your document.</p>
          </div>
          <ul role="list" className="flex flex-col gap-4">
            {checklist.map((requirement) => (
              <li key={requirement.id} className="flex items-start gap-3">
                <span className="flex h-lh items-center text-body-l">
                  <Checkbox
                    id={`check-${requirement.id}`}
                    checked={Boolean(assignment.finalChecks[requirement.id])}
                    onCheckedChange={() => act({ type: "toggleFinalCheck", requirementId: requirement.id })}
                  />
                </span>
                <label htmlFor={`check-${requirement.id}`} className="text-body-l text-text-primary">
                  {requirement.label}
                </label>
              </li>
            ))}
          </ul>
          <SubmissionReminder requirements={assignment.requirements} />
        </section>

        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={finishReview}>
            Finish review
          </Button>
          <Button variant="secondary" onClick={() => openPanel("plan")}>
            View full plan
          </Button>
        </div>

        {undoN > 0 && (
          <div className="flex items-center justify-between gap-4">
            <p id="undo-description" className="text-caption text-text-tertiary">
              Step {undoN} is marked done.
            </p>
            <Button variant="tertiary" onClick={undo} aria-describedby="undo-description">
              Undo
            </Button>
          </div>
        )}
      </main>
    </>
  );
}

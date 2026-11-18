"use client";

import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { PlanStepRow } from "@/components/PlanStepRow";
import { ReturnNote } from "@/components/ReturnNote";
import { SubmissionReminder } from "@/components/SubmissionReminder";
import { TopBar } from "@/components/TopBar";
import { assignmentContext, assignmentMeta } from "@/lib/format";
import { useMomentum } from "@/lib/momentum-store";
import { substantiveFirst } from "@/lib/step-state";
import { useFocusHeading } from "@/lib/use-focus-heading";
import { useRedirect } from "@/lib/use-redirect";
import { cn } from "@/lib/utils";

// /review: a read-only look at a completed assignment: plan, notes and final checklist.
// No Figma frame; built from existing components (docs/decisions.md).
export function ReviewScreen() {
  const { assignment, saveStatus } = useMomentum();
  const headingRef = useFocusHeading<HTMLHeadingElement>();
  const fits = assignment.status === "completed";
  useRedirect(fits ? null : "/");
  if (!fits) return null;

  const checklist = substantiveFirst(assignment.requirements).filter((r) => r.kind !== "submission");

  return (
    <>
      <TopBar mode="session" context={assignmentContext(assignment)} saveStatus={saveStatus} />
      <main className="mx-auto flex w-full max-w-home flex-col gap-8 px-4 pt-12 pb-16">
        <div className="flex flex-col items-start gap-4">
          <Link href="/" className="flex h-button-text items-center rounded-sm text-link text-text-primary">
            Back
          </Link>
          <div className="flex flex-col gap-1">
            <p className="text-caption text-text-tertiary">{assignmentMeta(assignment)}</p>
            <h1 ref={headingRef} tabIndex={-1} className="text-display text-text-primary focus-visible:shadow-none">
              {assignment.title}
            </h1>
          </div>
        </div>

        <section aria-labelledby="review-plan" className="flex flex-col gap-3">
          <h2 id="review-plan" className="text-heading-m text-text-primary">
            Plan
          </h2>
          <ol className="border-b border-border-default">
            {assignment.steps.map((step, index) => (
              <PlanStepRow key={step.id} number={index + 1} step={step}>
                {step.note && (
                  <div className="pt-2">
                    <ReturnNote note={step.note} savedAt={step.noteSavedAt} variant="static" />
                  </div>
                )}
              </PlanStepRow>
            ))}
          </ol>
        </section>

        <section aria-labelledby="review-checks" className="flex flex-col gap-4">
          <h2 id="review-checks" className="text-heading-m text-text-primary">
            Final check
          </h2>
          <ul role="list" className="flex flex-col gap-3">
            {checklist.map((requirement) => {
              const ticked = Boolean(assignment.finalChecks[requirement.id]);
              return (
                <li key={requirement.id} className="flex items-start gap-3 text-body-l text-text-primary">
                  <span className="flex h-lh items-center">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-checkbox items-center justify-center rounded-sm border border-border-rule",
                        ticked && "border-border-strong bg-action-primary text-text-on-primary",
                      )}
                    >
                      {ticked && <CheckIcon />}
                    </span>
                  </span>
                  <span>
                    <span className="sr-only">{ticked ? "Ticked: " : "Not ticked: "}</span>
                    {requirement.label}
                  </span>
                </li>
              );
            })}
          </ul>
          <SubmissionReminder requirements={assignment.requirements} />
        </section>
      </main>
    </>
  );
}

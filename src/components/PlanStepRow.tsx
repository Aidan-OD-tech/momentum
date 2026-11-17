import { CheckIcon } from "@/components/icons";
import { doneWhenSentence, formatMinutes } from "@/lib/format";
import type { Step } from "@/lib/types";
import { cn } from "@/lib/utils";

type PlanStepRowProps = {
  number: number;
  step: Step;
  // Extra content under the row, e.g. the step's note in review.
  children?: React.ReactNode;
};

// One step in the full plan (Figma "Plan step row", without Edit; editing is M3).
export function PlanStepRow({ number, step, children }: PlanStepRowProps) {
  const done = step.status === "done";
  const current = step.status === "inProgress";
  return (
    <li className="flex gap-4 border-t border-border-default py-4">
      <StepBadge number={number} status={step.status} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-4">
          <p className={cn("text-body-l", done ? "text-text-secondary" : "text-text-primary")}>
            <span className="sr-only">Step {number}: </span>
            {step.title}
          </p>
          <p className="shrink-0 text-caption text-text-tertiary">about {formatMinutes(step.estimateMin)}</p>
        </div>
        <p className="text-body text-text-secondary">{doneWhenSentence(step.doneWhen)}</p>
        {(done || current) && <p className="text-caption text-text-secondary">{done ? "Done" : "In progress"}</p>}
        {children}
      </div>
    </li>
  );
}

// Done: check in a light circle. Current: filled dark number. Upcoming: outlined number.
function StepBadge({ number, status }: { number: number; status: Step["status"] }) {
  const base = "flex size-badge shrink-0 items-center justify-center rounded-full text-caption";
  if (status === "done") {
    return (
      <span aria-hidden="true" className={cn(base, "bg-surface-subtle text-text-secondary")}>
        <CheckIcon />
      </span>
    );
  }
  if (status === "inProgress") {
    return (
      <span aria-hidden="true" className={cn(base, "bg-action-primary text-text-on-primary")}>
        {number}
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={cn(base, "border border-border-input text-text-secondary")}>
      {number}
    </span>
  );
}

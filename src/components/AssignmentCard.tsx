import { useId } from "react";
import { Progress } from "@/components/Progress";
import { assignmentMeta } from "@/lib/format";
import { countDoneSteps } from "@/lib/step-state";
import type { Assignment } from "@/lib/types";

type AssignmentCardProps = {
  assignment: Assignment;
  // Replaces the default progress text, e.g. to add the time left.
  progressLabel?: string;
  // Shows "Due date passed" instead of "Due" in the meta line.
  deadlinePassed?: boolean;
  children: React.ReactNode;
};

// The Up next card on the home list (Core 05 card): course and due date, title, progress, then the
// card's own well and actions. The title is an h3, under the list's "Up next" h2. 24 px padding below
// 600 px, so the well keeps room for its text (M7d responsive R2).
export function AssignmentCard({ assignment, progressLabel, deadlinePassed = false, children }: AssignmentCardProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-6 rounded-lg border border-border-default p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <p className="text-caption text-text-tertiary">{assignmentMeta(assignment, deadlinePassed)}</p>
        <h3 id={titleId} className="text-heading-l text-text-primary">
          {assignment.title}
        </h3>
      </div>
      <Progress done={countDoneSteps(assignment)} total={assignment.steps.length} label={progressLabel} />
      {children}
    </section>
  );
}

import { Progress } from "@/components/Progress";
import { assignmentMeta } from "@/lib/format";
import { countDoneSteps } from "@/lib/step-state";
import type { Assignment } from "@/lib/types";

type AssignmentCardProps = {
  assignment: Assignment;
  // Replaces the default progress text (completed home adds "· Final check reviewed").
  progressLabel?: string;
  children: React.ReactNode;
};

// The assignment card on home and completed home: course and due date, title, progress, then the
// screen's own well and actions.
export function AssignmentCard({ assignment, progressLabel, children }: AssignmentCardProps) {
  return (
    <section aria-labelledby="assignment-title" className="flex flex-col gap-6 rounded-lg border border-border-default p-8">
      <div className="flex flex-col gap-1">
        <p className="text-caption text-text-tertiary">{assignmentMeta(assignment)}</p>
        <h2 id="assignment-title" className="text-heading-l text-text-primary">
          {assignment.title}
        </h2>
      </div>
      <Progress done={countDoneSteps(assignment)} total={assignment.steps.length} label={progressLabel} />
      {children}
    </section>
  );
}

import { AssignmentCard } from "@/components/AssignmentCard";
import { progressLabel } from "@/components/Progress";
import { ReturnNote } from "@/components/ReturnNote";
import { Button } from "@/components/ui/button";
import { doneWhenSentence, formatMinutes } from "@/lib/format";
import { aboutTimeLeft, currentStatusLine } from "@/lib/home-list";
import { countDoneSteps, inProgressStepNumber, nextStepNumber } from "@/lib/step-state";
import type { Assignment } from "@/lib/types";

type UpNextCardProps = {
  // A current assignment (status review or active). The list's first one.
  assignment: Assignment;
  deadlinePassed: boolean;
  // Opens this assignment, then goes to `path`.
  onGo: (path: string) => void;
  // Opens this assignment, then the plan panel.
  onViewPlan: () => void;
};

// The first assignment on the home list, shown as the home card used to be: ready to review,
// paused (Core 04, 05), between steps (Core 10), or all steps done with the final check next.
export function UpNextCard({ assignment, deadlinePassed, onGo, onViewPlan }: UpNextCardProps) {
  const card = (label: string, children: React.ReactNode) => (
    <AssignmentCard assignment={assignment} progressLabel={label} deadlinePassed={deadlinePassed}>
      {children}
    </AssignmentCard>
  );

  if (assignment.status === "review") {
    return card(
      currentStatusLine(assignment),
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => onGo("/plan")}>
          Review plan
        </Button>
      </div>,
    );
  }

  const progress = progressLabel(countDoneSteps(assignment), assignment.steps.length);
  const pausedN = inProgressStepNumber(assignment);
  const nextN = pausedN ?? nextStepNumber(assignment);

  if (!nextN) {
    // Every step done, final check not finished (e.g. the student left the final check). No time left to show.
    return card(
      progress,
      <>
        <div className="flex flex-col gap-1 rounded-md bg-surface-subtle p-6">
          <p className="text-label text-text-secondary">Next up · Final check</p>
          <p className="text-body text-text-secondary">Check your document against the brief before you submit it.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => onGo("/final")}>
            Go to the final check
          </Button>
          <Button variant="secondary" onClick={onViewPlan}>
            View full plan
          </Button>
        </div>
      </>,
    );
  }

  const step = assignment.steps[nextN - 1];
  const label = pausedN
    ? `Step ${nextN} · In progress`
    : `Next up · Step ${nextN} · about ${formatMinutes(step.estimateMin)} for the full step`;
  return card(
    `${progress} · ${aboutTimeLeft(assignment)} of steps left`,
    <>
      <div className="flex flex-col gap-3 rounded-md bg-surface-subtle p-6">
        <p className="text-label text-text-secondary">{label}</p>
        <h4 className="text-heading-m text-text-primary">{step.title}</h4>
        {pausedN && step.note && <ReturnNote note={step.note} savedAt={step.noteSavedAt} variant="static" />}
        <p className="text-body text-text-secondary">{doneWhenSentence(step.doneWhen)}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => onGo(`/step/${nextN}`)}>
          {pausedN ? "Resume" : "Start"} step {nextN}
        </Button>
        <Button variant="secondary" onClick={onViewPlan}>
          View full plan
        </Button>
      </div>
    </>,
  );
}

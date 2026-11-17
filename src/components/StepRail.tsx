"use client";

import { Progress } from "@/components/Progress";
import { RailStep } from "@/components/RailStep";
import { usePanel } from "@/components/SidePanel";
import { Button } from "@/components/ui/button";
import { formatDeadline } from "@/lib/format";
import { countDoneSteps } from "@/lib/step-state";
import type { Assignment } from "@/lib/types";

type StepRailProps = {
  assignment: Assignment;
  // The step on screen.
  currentNumber: number;
};

// The left rail on the working step: progress, the done steps and the one on screen, two panel links, the due line.
export function StepRail({ assignment, currentNumber }: StepRailProps) {
  const { openPanel } = usePanel();
  const due = assignment.deadline ? formatDeadline(assignment.deadline) : null;
  const rows = assignment.steps
    .map((step, index) => ({ step, number: index + 1 }))
    .filter(({ step, number }) => step.status === "done" || number === currentNumber);

  return (
    <nav aria-label="Your steps" className="flex w-full flex-col gap-6 wide:w-rail wide:shrink-0">
      <Progress done={countDoneSteps(assignment)} total={assignment.steps.length} labelPosition="above" />
      <ol className="flex flex-col gap-1">
        {rows.map(({ step, number }) => (
          <RailStep
            key={step.id}
            number={number}
            label={step.title}
            state={number === currentNumber && step.status !== "done" ? "current" : "done"}
          />
        ))}
      </ol>
      <div className="flex flex-col items-start">
        <Button variant="tertiary" onClick={() => openPanel("plan")}>
          View full plan
        </Button>
        <Button variant="tertiary" onClick={() => openPanel("brief")}>
          Original brief
        </Button>
      </div>
      {due && <p className="text-caption text-text-tertiary">Due {due}</p>}
    </nav>
  );
}

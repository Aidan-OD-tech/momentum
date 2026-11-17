import { Progress } from "@/components/Progress";
import { RailStep } from "@/components/RailStep";
import { Button } from "@/components/ui/button";
import { formatDeadline } from "@/lib/format";
import type { StepDisplayState } from "@/lib/step-state";

type StepRailProps = {
  steps: { id: string; title: string; state: StepDisplayState }[];
  deadline?: string;
};

// The left rail on the working step: progress, the done steps and the current one, two links and the due line.
export function StepRail({ steps, deadline }: StepRailProps) {
  const doneCount = steps.filter((step) => step.state === "done").length;
  const visibleSteps = steps.filter((step) => step.state !== "upcoming");
  const due = deadline ? formatDeadline(deadline) : null;

  return (
    <nav aria-label="Your steps" className="flex w-full flex-col gap-6 wide:w-rail wide:shrink-0">
      <Progress done={doneCount} total={steps.length} />
      <ol className="flex flex-col gap-3">
        {visibleSteps.map((step) => (
          <RailStep key={step.id} label={step.title} state={step.state === "done" ? "done" : "current"} />
        ))}
      </ol>
      <div className="flex flex-col items-start">
        {/* M2: open the full plan in a side panel. */}
        <Button variant="tertiary">View full plan</Button>
        {/* M2: open the original brief in a side panel. */}
        <Button variant="tertiary">Original brief</Button>
      </div>
      {due && <p className="text-caption text-text-tertiary">Due {due}</p>}
    </nav>
  );
}

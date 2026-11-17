import { BriefRequirements } from "@/components/BriefRequirements";
import { BulletItem } from "@/components/BulletItem";
import { DoneWhen } from "@/components/DoneWhen";
import { Timer } from "@/components/Timer";
import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/lib/format";
import type { Requirement, Step } from "@/lib/types";

type WorkingStepProps = {
  step: Step;
  stepNumber: number;
  stepCount: number;
  requirements: Requirement[];
};

// The main column of the working-step screen.
export function WorkingStep({ step, stepNumber, stepCount, requirements }: WorkingStepProps) {
  return (
    <main className="flex w-full max-w-column flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-caption text-text-tertiary">
          Step {stepNumber} of {stepCount} · about {formatMinutes(step.estimateMin)} for the full step
        </p>
        <h1 className="text-heading-l text-text-primary">{step.title}</h1>
        {step.intro && <p className="text-body-l text-text-secondary">{step.intro}</p>}
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-label text-text-secondary">What to do</h2>
        <ul role="list" className="flex flex-col gap-2">
          {step.whatToDo.map((item) => (
            <BulletItem key={item}>{item}</BulletItem>
          ))}
        </ul>
      </section>

      <DoneWhen criterion={step.doneWhen} />

      <div className="flex flex-wrap gap-3">
        {/* M2: mark the step done and go to the next step (or the final check after the last step). */}
        <Button variant="primary">Mark complete</Button>
        {/* M2: open the pause dialog with the optional note. */}
        <Button variant="secondary">Pause for later</Button>
      </div>

      <div className="border-t border-border-default pt-4">
        <BriefRequirements requirements={requirements} />
      </div>

      <div className="border-t border-border-default pt-4">
        <Timer minutes={step.estimateMin} />
      </div>
    </main>
  );
}

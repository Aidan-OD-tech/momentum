import { notFound } from "next/navigation";
import { StepRail } from "@/components/StepRail";
import { TopBar } from "@/components/TopBar";
import { WorkingStep } from "@/components/WorkingStep";
import { sampleAssignment } from "@/data/sample-assignment";
import { getStepDisplayStates, parseStepNumber } from "@/lib/step-state";

const { steps } = sampleAssignment;

// Build /step/1 to /step/N ahead of time, N being the number of steps in the data.
export function generateStaticParams() {
  return steps.map((_, index) => ({ n: String(index + 1) }));
}

// M1 preview: shows step n of the sample assignment. Which steps are done comes from n alone; nothing is stored.
export default async function StepPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const stepNumber = parseStepNumber(n, steps.length);
  if (stepNumber === null) notFound();

  const displayStates = getStepDisplayStates(steps.length, stepNumber);
  const railSteps = steps.map((step, index) => ({ id: step.id, title: step.title, state: displayStates[index] }));
  const context = [sampleAssignment.course, sampleAssignment.title].filter(Boolean).join(" · ");

  return (
    <>
      {/* saveStatus stays "hidden" in M1: nothing is written anywhere, so there is nothing to confirm. */}
      <TopBar mode="session" context={context} saveStatus="hidden" />
      <div className="flex flex-col items-start gap-8 px-4 pt-step-top pb-16 wide:flex-row wide:justify-center wide:gap-16 wide:px-8">
        <StepRail steps={railSteps} deadline={sampleAssignment.deadline} />
        <WorkingStep
          step={steps[stepNumber - 1]}
          stepNumber={stepNumber}
          stepCount={steps.length}
          requirements={sampleAssignment.requirements}
        />
      </div>
    </>
  );
}

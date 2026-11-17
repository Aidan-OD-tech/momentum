"use client";

import { notFound, useRouter } from "next/navigation";
import { useEffect } from "react";
import { StepRail } from "@/components/StepRail";
import { TopBar } from "@/components/TopBar";
import { WorkingStep } from "@/components/WorkingStep";
import { assignmentContext } from "@/lib/format";
import { useMomentum } from "@/lib/momentum-store";

// /step/n: the working step (Core 01, 06, 07, 08, 11, 12; Setup 06).
export function StepScreen({ n }: { n: number }) {
  const { assignment, saveStatus, act, markProgressSaved } = useMomentum();
  const router = useRouter();
  const step = assignment.steps[n - 1];

  // Opening a step sets it in progress (if it was upcoming).
  useEffect(() => {
    if (step) act({ type: "openStep", n });
  }, [n, step, act]);

  // The URL is well formed (the server checked) but past the end of this plan. Only the browser
  // knows the plan's length, so this is a client-side Not found with HTTP 200 (see docs/decisions.md).
  if (!step) notFound();

  function markComplete() {
    const othersDone = assignment.steps.every((other, index) => index === n - 1 || other.status === "done");
    act({ type: "completeStep", n });
    router.push(othersDone ? "/final" : `/step/${n}/done`);
  }

  function finishForNow(noteText: string) {
    const ok = act({ type: "finishForNow", n, noteText, at: new Date().toISOString() });
    if (ok) markProgressSaved();
    router.push("/");
  }

  return (
    <>
      <TopBar mode="session" context={assignmentContext(assignment)} saveStatus={saveStatus} />
      <div className="flex flex-col items-start gap-8 px-4 pt-step-top pb-16 wide:flex-row wide:justify-center wide:gap-16 wide:px-8">
        <StepRail assignment={assignment} currentNumber={n} />
        <WorkingStep
          step={step}
          stepNumber={n}
          stepCount={assignment.steps.length}
          requirements={assignment.requirements}
          onMarkComplete={markComplete}
          onPauseDraftChange={(text) => act({ type: "setPauseDraft", n, text })}
          onFinishForNow={finishForNow}
          onNoteHiddenChange={(hidden) => act({ type: "setNoteHidden", n, hidden })}
        />
      </div>
    </>
  );
}

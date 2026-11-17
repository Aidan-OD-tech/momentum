"use client";

import { useRouter } from "next/navigation";
import { AssignmentCard } from "@/components/AssignmentCard";
import { CheckIcon, SavedCheckIcon } from "@/components/icons";
import { progressLabel } from "@/components/Progress";
import { ReturnNote } from "@/components/ReturnNote";
import { usePanel } from "@/components/SidePanel";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { doneWhenSentence, formatMinutes } from "@/lib/format";
import { useMomentum } from "@/lib/momentum-store";
import { countDoneSteps, inProgressStepNumber, nextStepNumber } from "@/lib/step-state";
import { useFocusHeading } from "@/lib/use-focus-heading";

// "/": home. Paused (a step in progress: Core 04, 05), between steps (Core 10),
// all steps done but not reviewed (no frame; points to the final check), or completed (R3 02).
export function HomeScreen() {
  const { assignment, saveStatus, progressSaved, act } = useMomentum();
  const { openPanel } = usePanel();
  const router = useRouter();
  const headingRef = useFocusHeading<HTMLHeadingElement>(assignment.id);
  const completed = assignment.status === "completed";
  const pausedN = inProgressStepNumber(assignment);
  const nextN = pausedN ?? nextStepNumber(assignment);

  const heading = completed ? "All steps done" : pausedN ? "Pick up where you left off" : "Your next step";

  function startNewAssignment() {
    // M3: open brief entry instead. The completed record stays in storage either way.
    act({ type: "startNewAssignment", newId: crypto.randomUUID() });
  }

  let body: React.ReactNode;
  if (completed) {
    const reviewed = assignment.finalReviewedAt ? " · Final check reviewed" : "";
    body = (
      <AssignmentCard
        assignment={assignment}
        progressLabel={progressLabel(countDoneSteps(assignment), assignment.steps.length) + reviewed}
      >
        <div className="flex flex-col gap-1 rounded-md bg-surface-subtle p-6">
          <p className="flex items-center gap-2 text-body-strong text-text-primary">
            <CheckIcon />
            Your plan and final check are kept in this browser.
          </p>
          <p className="text-body text-text-secondary">Submission happens in Turnitin. Momentum doesn’t submit or track it.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => router.push("/review")}>
            Review assignment
          </Button>
          <Button variant="primary" onClick={startNewAssignment}>
            Start a new assignment
          </Button>
        </div>
      </AssignmentCard>
    );
  } else if (nextN) {
    const step = assignment.steps[nextN - 1];
    const label = pausedN
      ? `Step ${nextN} · In progress`
      : `Next up · Step ${nextN} · about ${formatMinutes(step.estimateMin)} for the full step`;
    body = (
      <AssignmentCard assignment={assignment}>
        <div className="flex flex-col gap-3 rounded-md bg-surface-subtle p-6">
          <p className="text-label text-text-secondary">{label}</p>
          <h3 className="text-heading-m text-text-primary">{step.title}</h3>
          {pausedN && step.note && <ReturnNote note={step.note} savedAt={step.noteSavedAt} variant="static" />}
          <p className="text-body text-text-secondary">{doneWhenSentence(step.doneWhen)}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => router.push(`/step/${nextN}`)}>
            {pausedN ? "Resume" : "Start"} step {nextN}
          </Button>
          <Button variant="secondary" onClick={() => openPanel("plan")}>
            View full plan
          </Button>
        </div>
      </AssignmentCard>
    );
  } else {
    // Every step done, final check not finished (e.g. the student left the final check).
    body = (
      <AssignmentCard assignment={assignment}>
        <div className="flex flex-col gap-1 rounded-md bg-surface-subtle p-6">
          <p className="text-label text-text-secondary">Next up · Final check</p>
          <p className="text-body text-text-secondary">Check your document against the brief before you submit it.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => router.push("/final")}>
            Go to the final check
          </Button>
          <Button variant="secondary" onClick={() => openPanel("plan")}>
            View full plan
          </Button>
        </div>
      </AssignmentCard>
    );
  }

  return (
    <>
      <TopBar mode="home" saveStatus={saveStatus} />
      <main className="mx-auto flex w-full max-w-home flex-col gap-6 px-4 pt-12 pb-16">
        {progressSaved && saveStatus !== "failed" && (
          <p role="status" className="flex items-center gap-2 text-caption text-text-secondary">
            <SavedCheckIcon />
            Progress saved
          </p>
        )}
        <h1 ref={headingRef} tabIndex={-1} className="text-display text-text-primary focus-visible:shadow-none">
          {heading}
        </h1>
        {body}
      </main>
    </>
  );
}

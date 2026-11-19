"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AssignmentRow } from "@/components/AssignmentRow";
import { CheckIcon, ChevronIcon, SavedCheckIcon } from "@/components/icons";
import { usePanel } from "@/components/SidePanel";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { UpNextCard } from "@/components/UpNextCard";
import { currentStatusLine, finishedStatusLine, openPath } from "@/lib/home-list";
import { useMomentumData } from "@/lib/momentum-store";
import { currentAssignments, deadlinePassed, finishedAssignments, hasDeadline } from "@/lib/priority";
import type { Assignment } from "@/lib/types";
import { useFocusHeading } from "@/lib/use-focus-heading";
import { cn } from "@/lib/utils";

// "/" once there is at least one assignment (M7-1): Up next, then the other current assignments,
// then the finished ones. The order comes only from currentAssignments and finishedAssignments.
// Every screen after this one works on the open assignment, so each button opens its assignment first.
export function HomeListScreen() {
  const { data, saveStatus, progressSaved, justFinishedId, act } = useMomentumData();
  const { openPanel } = usePanel();
  const router = useRouter();
  const headingRef = useFocusHeading<HTMLHeadingElement>();
  // Collapsed on every visit; not stored.
  const [finishedOpen, setFinishedOpen] = useState(false);

  const now = new Date();
  const [upNext, ...rest] = currentAssignments(data.assignments);
  // Filtering keeps the priority order within each group.
  const dated = rest.filter(hasDeadline);
  const undated = rest.filter((assignment) => !hasDeadline(assignment));
  const finished = finishedAssignments(data.assignments);
  const justFinished = data.assignments.find((assignment) => assignment.id === justFinishedId);

  function go(assignment: Assignment, path: string) {
    act({ type: "openAssignment", id: assignment.id });
    router.push(path);
  }

  const addAssignments = (variant: "primary" | "secondary") => (
    <Button variant={variant} onClick={() => router.push("/new")}>
      Add assignments
    </Button>
  );

  const currentRow = (assignment: Assignment) => (
    <AssignmentRow
      key={assignment.id}
      assignment={assignment}
      status={currentStatusLine(assignment, now)}
      deadlinePassed={deadlinePassed(assignment, now)}
      actionLabel={assignment.status === "review" ? "Review plan" : "Open"}
      onAction={() => go(assignment, openPath(assignment))}
    />
  );

  return (
    <>
      <TopBar mode="home" saveStatus={saveStatus} />
      <main className="mx-auto flex w-full max-w-home flex-col gap-8 px-4 pt-12 pb-16">
        {progressSaved && saveStatus !== "failed" && (
          <p role="status" className="flex items-center gap-2 text-caption text-text-secondary">
            <SavedCheckIcon />
            Progress saved
          </p>
        )}
        {justFinished && saveStatus !== "failed" && (
          // Keeps the R3 02 honesty copy now that the completed home is gone.
          <p role="status" className="flex items-start gap-2 text-body text-text-secondary">
            <span className="flex h-lh items-center text-text-primary">
              <CheckIcon />
            </span>
            {justFinished.title}: all steps done. Your plan and final check are kept in this browser. Submission happens in
            Turnitin. Momentum doesn’t submit or track it.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 ref={headingRef} tabIndex={-1} className="text-display text-text-primary focus-visible:shadow-none">
              Your assignments
            </h1>
            {addAssignments("secondary")}
          </div>
          <p className="text-body text-text-secondary">
            Soonest deadline first. Time left adds up the estimates for steps you haven’t finished, so it’s approximate.
          </p>
        </div>

        {upNext ? (
          <Group id="up-next" heading="Up next">
            <UpNextCard
              assignment={upNext}
              deadlinePassed={deadlinePassed(upNext, now)}
              onGo={(path) => go(upNext, path)}
              onViewPlan={() => {
                act({ type: "openAssignment", id: upNext.id });
                openPanel("plan");
              }}
            />
          </Group>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="text-body-l text-text-primary">Nothing in progress.</p>
            {addAssignments("primary")}
          </div>
        )}

        {dated.length > 0 && (
          <Group id="after-that" heading="After that">
            <ul role="list" className="border-b border-border-default">
              {dated.map(currentRow)}
            </ul>
          </Group>
        )}

        {undated.length > 0 && (
          <Group id="no-deadline" heading="No deadline">
            <ul role="list" className="border-b border-border-default">
              {undated.map(currentRow)}
            </ul>
          </Group>
        )}

        {finished.length > 0 && (
          <section aria-labelledby="finished" className="flex flex-col gap-3">
            <h2 id="finished" className="text-label text-text-secondary">
              <button
                type="button"
                aria-expanded={finishedOpen}
                aria-controls="finished-list"
                onClick={() => setFinishedOpen((open) => !open)}
                className="flex h-button-text items-center gap-2 rounded-sm text-text-secondary hover:text-text-primary"
              >
                {/* The chevron points down; turned a quarter it points right, while collapsed. */}
                <ChevronIcon className={cn("motion-safe:transition-transform", !finishedOpen && "-rotate-90")} />
                Finished ({finished.length}) · kept in this browser
              </button>
            </h2>
            <ul id="finished-list" role="list" hidden={!finishedOpen} className="border-b border-border-default">
              {finished.map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  status={finishedStatusLine(assignment)}
                  actionLabel="Review"
                  onAction={() => go(assignment, "/review")}
                />
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}

// A labeled group of the list: a small h2 in the Label style, then its content.
function Group({ id, heading, children }: { id: string; heading: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-label text-text-secondary">
        {heading}
      </h2>
      {children}
    </section>
  );
}

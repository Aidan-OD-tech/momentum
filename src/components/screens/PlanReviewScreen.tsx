"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Chip } from "@/components/Chip";
import { CheckIcon } from "@/components/icons";
import { PlanStepRow } from "@/components/PlanStepRow";
import { RequirementsEditCard } from "@/components/RequirementsEditCard";
import { usePanel } from "@/components/SidePanel";
import { StepEditCard } from "@/components/StepEditCard";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { assignmentMeta, formatDeadline, formatTotalMinutes } from "@/lib/format";
import { useMomentumData } from "@/lib/momentum-store";
import { applyRequirementRows, NEW_STEP_DRAFT, type RequirementRow, sameRequirements, type StepDraft, stepFromDraft } from "@/lib/plan-edits";
import { substantiveFirst, totalEstimateMinutes } from "@/lib/step-state";
import type { Step } from "@/lib/types";
import { useFocusHeading } from "@/lib/use-focus-heading";
import { useRedirect } from "@/lib/use-redirect";

// What is open for editing. Only one edit card at a time.
type Editing = null | { kind: "step"; id: string } | { kind: "newStep" } | { kind: "requirements" };

const draftOf = (step: Step): StepDraft => ({
  title: step.title,
  whatToDo: step.whatToDo,
  doneWhen: step.doneWhen,
  estimateMin: step.estimateMin,
});

// /plan: plan review and editing (Setup 03, 04, 05; R3 03). Only while the plan is in review:
// with no plan, or once step 1 has started, it sends the browser to "/" (no editing after starting).
export function PlanReviewScreen() {
  const { assignment, saveStatus, act } = useMomentumData();
  const { openPanel } = usePanel();
  const router = useRouter();
  const headingRef = useFocusHeading<HTMLHeadingElement>();
  const [editing, setEditing] = useState<Editing>(null);
  // "Requirements updated" (R3 03). In memory only, so it clears when the student leaves this screen.
  const [notice, setNotice] = useState(false);
  // An element id to focus after the next render, e.g. the Edit button of the step that was just closed.
  const [focusTarget, setFocusTarget] = useState<{ id: string } | null>(null);
  // Set by Start step 1, so the check below doesn't race it with a redirect home.
  const [leaving, setLeaving] = useState(false);

  const fits = assignment?.status === "review";
  useRedirect(fits || leaving ? null : "/");

  useEffect(() => {
    if (!focusTarget) return;
    // focus() also scrolls the element into view.
    document.getElementById(focusTarget.id)?.focus();
  }, [focusTarget]);

  if (!assignment || !fits) return null;

  const steps = assignment.steps;
  const due = assignment.deadline ? formatDeadline(assignment.deadline) : null;
  const chips = substantiveFirst(assignment.requirements).map((r) => ({ key: r.id, text: r.shortLabel ?? r.label }));
  if (due) chips.push({ key: "due", text: `Due ${due}` });

  function close(focusId: string) {
    setEditing(null);
    setFocusTarget({ id: focusId });
  }

  function saveStep(n: number, step: Step, draft: StepDraft) {
    act({ type: "updateStep", n, step: stepFromDraft(step.id, draft) });
    close(`edit-step-${step.id}`);
  }

  function addStep(draft: StepDraft) {
    const id = crypto.randomUUID();
    act({ type: "addStep", step: stepFromDraft(id, draft) });
    close(`edit-step-${id}`);
  }

  function deleteStep(n: number) {
    act({ type: "deleteStep", n });
    close("steps-heading");
  }

  function saveRequirements(rows: RequirementRow[]) {
    const next = applyRequirementRows(assignment!.requirements, rows, () => crypto.randomUUID());
    // The notice says something changed, so it only shows when something did.
    if (!sameRequirements(next, assignment!.requirements)) {
      act({ type: "updateRequirements", requirements: next });
      setNotice(true);
    }
    close("edit-requirements");
  }

  function startStep1() {
    if (editing) return; // aria-disabled: the reason is described on the button.
    setLeaving(true);
    act({ type: "startPlan" });
    router.push("/step/1");
  }

  return (
    <>
      <TopBar mode="home" saveStatus={saveStatus} />
      <main className="mx-auto flex w-full max-w-home flex-col gap-8 px-4 pt-12 pb-16">
        <div className="flex flex-col gap-2">
          <p className="text-caption text-text-tertiary">{assignmentMeta(assignment)}</p>
          <h1 ref={headingRef} tabIndex={-1} className="text-display text-text-primary focus-visible:shadow-none">
            {assignment.title}
          </h1>
          <p className="text-body text-text-secondary">
            {steps.length} {steps.length === 1 ? "step" : "steps"} · about {formatTotalMinutes(totalEstimateMinutes(assignment))} in
            total. Times are approximate.
          </p>
        </div>

        <section aria-labelledby="summary-heading" className="flex flex-col gap-2">
          <h2 id="summary-heading" className="text-label text-text-secondary">
            Summary
          </h2>
          <p className="text-body-l text-text-primary">{assignment.summary}</p>
        </section>

        <div className="flex flex-col gap-4">
          {editing?.kind === "requirements" ? (
            <RequirementsEditCard
              requirements={assignment.requirements}
              onDone={saveRequirements}
              onCancel={() => close("edit-requirements")}
              onViewBrief={() => openPanel("brief")}
            />
          ) : (
            <section aria-labelledby="brief-heading" className="flex flex-col gap-4 rounded-lg border border-border-default p-6">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="brief-heading" className="text-body-strong text-text-primary">
                  From your brief
                </h2>
                <div className="flex gap-4">
                  {!editing && (
                    <Button id="edit-requirements" variant="tertiary" aria-label="Edit requirements" onClick={() => setEditing({ kind: "requirements" })}>
                      Edit
                    </Button>
                  )}
                  <Button variant="tertiary" onClick={() => openPanel("brief")}>
                    View original brief
                  </Button>
                </div>
              </div>
              <ul role="list" className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <li key={chip.key}>
                    <Chip>{chip.text}</Chip>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div role="status">
            {notice && (
              <div className="flex items-start justify-between gap-4 rounded-md bg-surface-subtle p-4">
                <span className="text-text-primary">
                  <CheckIcon />
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-body-strong text-text-primary">Requirements updated. Your final checklist now matches.</p>
                  <p className="text-body text-text-secondary">Check that your steps still fit. Momentum hasn’t changed them.</p>
                </div>
                <Button variant="tertiary" onClick={() => setFocusTarget({ id: "steps-heading" })}>
                  Review steps
                </Button>
              </div>
            )}
          </div>
        </div>

        <section aria-labelledby="steps-heading" className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="steps-heading" tabIndex={-1} className="text-heading-m text-text-primary focus-visible:shadow-none">
                Suggested steps
              </h2>
              {!editing && (
                <Button id="add-step" variant="tertiary" onClick={() => setEditing({ kind: "newStep" })}>
                  Add a step
                </Button>
              )}
            </div>
            <p className="text-body text-text-secondary">Edit any step. Changing one doesn’t change the others.</p>
          </div>

          <ol className="border-b border-border-default">
            {steps.map((step, index) =>
              editing?.kind === "step" && editing.id === step.id ? (
                <li key={step.id} className="border-t border-border-default py-4">
                  <StepEditCard
                    number={index + 1}
                    initial={draftOf(step)}
                    canDelete={steps.length > 1}
                    onDone={(draft) => saveStep(index + 1, step, draft)}
                    onCancel={() => close(`edit-step-${step.id}`)}
                    onDelete={() => deleteStep(index + 1)}
                  />
                </li>
              ) : (
                <PlanStepRow
                  key={step.id}
                  number={index + 1}
                  step={step}
                  editId={`edit-step-${step.id}`}
                  onEdit={editing ? undefined : () => setEditing({ kind: "step", id: step.id })}
                />
              ),
            )}
            {editing?.kind === "newStep" && (
              <li className="border-t border-border-default py-4">
                <StepEditCard
                  number={steps.length + 1}
                  initial={NEW_STEP_DRAFT}
                  canDelete={false}
                  onDone={addStep}
                  onCancel={() => close("add-step")}
                  onDelete={() => {}}
                />
              </li>
            )}
          </ol>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-caption text-text-tertiary">You’ll see one step at a time while you work.</p>
          <Button variant="primary" aria-disabled={Boolean(editing)} aria-describedby={editing ? "start-reason" : undefined} onClick={startStep1}>
            Start step 1
          </Button>
          {editing && (
            // DEVELOPMENT COPY: no Figma frame gives the reason in words.
            <p id="start-reason" className="sr-only">
              Finish editing to start.
            </p>
          )}
        </div>
      </main>
    </>
  );
}

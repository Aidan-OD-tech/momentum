"use client";

import { useEffect, useRef, useState } from "react";
import { EstimateStepper } from "@/components/EstimateStepper";
import { Button } from "@/components/ui/button";
import { FieldError, TextInput } from "@/components/ui/text-field";
import { type StepDraft, type StepErrors, validateStep } from "@/lib/plan-edits";

type StepEditCardProps = {
  number: number;
  initial: StepDraft;
  // False for the last remaining step and for a step that hasn't been added yet.
  canDelete: boolean;
  onDone: (draft: StepDraft) => void;
  onCancel: () => void;
  onDelete: () => void;
};

// Editing one step on plan review (Setup 04). Changes stay in this card until Done editing;
// Cancel throws them away. Other steps are never touched.
export function StepEditCard({ number, initial, canDelete, onDone, onCancel, onDelete }: StepEditCardProps) {
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<StepErrors>({});
  // The field to focus after the next render: the title when the card opens, a new item when one is added.
  // A new object each time, so asking for the same field twice still moves focus.
  const [focusTarget, setFocusTarget] = useState({ id: "step-title" });
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    card.current?.querySelector<HTMLElement>(`#${focusTarget.id}`)?.focus();
  }, [focusTarget]);

  const update = (patch: Partial<StepDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const setItem = (index: number, text: string) =>
    update({ whatToDo: draft.whatToDo.map((item, i) => (i === index ? text : item)) });

  function done() {
    const found = validateStep(draft);
    setErrors(found);
    if (found.title || found.doneWhen) {
      // Focus the first invalid field.
      setFocusTarget({ id: found.title ? "step-title" : "step-done-when" });
      return;
    }
    onDone(draft);
  }

  return (
    <div ref={card} className="flex flex-col gap-6 rounded-lg border border-border-strong p-6">
      <h3 className="text-label text-text-secondary">Editing step {number}</h3>

      <div className="flex flex-col gap-2">
        <label htmlFor="step-title" className="text-body-strong text-text-primary">
          Step title
        </label>
        <TextInput
          id="step-title"
          value={draft.title}
          onChange={(event) => update({ title: event.target.value })}
          aria-invalid={Boolean(errors.title) || undefined}
          aria-describedby={errors.title ? "step-title-error" : undefined}
        />
        {errors.title && <FieldError id="step-title-error">{errors.title}</FieldError>}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 text-body-strong text-text-primary">What to do</legend>
        {draft.whatToDo.length > 0 && (
          <ul role="list" className="flex flex-col gap-2">
            {draft.whatToDo.map((item, index) => (
              <li key={index} className="flex items-center gap-3">
                <label htmlFor={`what-to-do-${index}`} className="sr-only">
                  What to do, item {index + 1}
                </label>
                <TextInput id={`what-to-do-${index}`} value={item} onChange={(event) => setItem(index, event.target.value)} />
                <Button
                  variant="tertiary"
                  aria-label={`Remove item ${index + 1}`}
                  onClick={() => {
                    const rest = draft.whatToDo.filter((_, i) => i !== index);
                    update({ whatToDo: rest });
                    // Focus goes to the item that moved into this place, or to Add an item.
                    setFocusTarget({ id: index < rest.length ? `what-to-do-${index}` : "add-item" });
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Button
          id="add-item"
          variant="tertiary"
          className="self-start"
          onClick={() => {
            update({ whatToDo: [...draft.whatToDo, ""] });
            setFocusTarget({ id: `what-to-do-${draft.whatToDo.length}` });
          }}
        >
          Add an item
        </Button>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="step-done-when" className="text-body-strong text-text-primary">
          Done when
        </label>
        <TextInput
          id="step-done-when"
          value={draft.doneWhen}
          onChange={(event) => update({ doneWhen: event.target.value })}
          aria-invalid={Boolean(errors.doneWhen) || undefined}
          aria-describedby={errors.doneWhen ? "step-done-when-error" : undefined}
        />
        {errors.doneWhen && <FieldError id="step-done-when-error">{errors.doneWhen}</FieldError>}
      </div>

      <div className="flex flex-col gap-2">
        <p id="step-estimate-label" className="text-body-strong text-text-primary">
          Approximate time for the full step
        </p>
        <EstimateStepper labelledBy="step-estimate-label" minutes={draft.estimateMin} onChange={(estimateMin) => update({ estimateMin })} />
        <p className="text-caption text-text-tertiary">Other steps stay as they are.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {canDelete && (
            <Button variant="tertiary" onClick={onDelete}>
              Delete step
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={done}>
            Done editing
          </Button>
        </div>
      </div>
    </div>
  );
}

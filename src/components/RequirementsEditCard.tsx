"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-field";
import type { RequirementRow } from "@/lib/plan-edits";
import type { Requirement } from "@/lib/types";

type RequirementsEditCardProps = {
  requirements: Requirement[];
  onDone: (rows: RequirementRow[]) => void;
  onCancel: () => void;
  onViewBrief: () => void;
};

// A row plus a key for React that stays the same while rows are added and removed.
type KeyedRow = RequirementRow & { key: number };

// Editing the requirements on plan review (Setup 05). Each field edits the requirement's full label,
// the text the final check shows. Cancel throws the changes away.
export function RequirementsEditCard({ requirements, onDone, onCancel, onViewBrief }: RequirementsEditCardProps) {
  const [rows, setRows] = useState<KeyedRow[]>(() => requirements.map((r, index) => ({ key: index, id: r.id, label: r.label })));
  const nextKey = useRef(requirements.length);
  // The field to focus after the next render (see StepEditCard).
  const [focusTarget, setFocusTarget] = useState({ id: "requirement-0" });
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    card.current?.querySelector<HTMLElement>(`#${focusTarget.id}`)?.focus();
  }, [focusTarget]);

  function remove(index: number) {
    const rest = rows.filter((_, i) => i !== index);
    setRows(rest);
    setFocusTarget({ id: index < rest.length ? `requirement-${index}` : "add-requirement" });
  }

  function add() {
    setRows([...rows, { key: nextKey.current++, id: null, label: "" }]);
    setFocusTarget({ id: `requirement-${rows.length}` });
  }

  return (
    <div ref={card} className="flex flex-col gap-4 rounded-lg border border-border-strong p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-body-strong text-text-primary">Edit requirements</h2>
        <Button variant="tertiary" onClick={onViewBrief}>
          View original brief
        </Button>
      </div>
      <p className="text-body text-text-secondary">Fix anything that was read wrong. These feed your final check.</p>

      {rows.length > 0 && (
        <ul role="list" className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <li key={row.key} className="flex items-center gap-3">
              <label htmlFor={`requirement-${index}`} className="sr-only">
                Requirement {index + 1}
              </label>
              <TextInput
                id={`requirement-${index}`}
                value={row.label}
                onChange={(event) => setRows(rows.map((r, i) => (i === index ? { ...r, label: event.target.value } : r)))}
              />
              <Button variant="tertiary" aria-label={`Remove requirement ${index + 1}`} onClick={() => remove(index)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button id="add-requirement" variant="tertiary" className="self-start" onClick={add}>
        Add a requirement
      </Button>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => onDone(rows.map(({ id, label }) => ({ id, label })))}>
          Done
        </Button>
      </div>
    </div>
  );
}

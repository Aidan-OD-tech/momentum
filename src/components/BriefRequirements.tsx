"use client";

import { useState } from "react";
import { Chip } from "@/components/Chip";
import { ChevronIcon } from "@/components/icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Requirement, RequirementKind } from "@/lib/types";

const KIND_ORDER: Record<RequirementKind, number> = { substantive: 0, format: 1, submission: 2 };

// Substantive requirements first. Within a kind the original order is kept.
function substantiveFirst(requirements: Requirement[]): Requirement[] {
  return [...requirements].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
}

// "From your brief": a one-line summary when collapsed, every requirement as a chip when expanded.
export function BriefRequirements({ requirements }: { requirements: Requirement[] }) {
  const [open, setOpen] = useState(false);
  const ordered = substantiveFirst(requirements);
  // Requirements without a shortLabel are left out of this line; they still show as chips when expanded.
  const summary = ordered
    .map((requirement) => requirement.shortLabel)
    .filter(Boolean)
    .join(" · ");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group flex min-h-button-text w-full items-center justify-between gap-4 rounded-sm text-left">
        <span className="flex flex-col">
          <span className="text-body-strong text-text-primary">From your brief</span>
          {!open && summary && <span className="text-caption text-text-secondary">{summary}</span>}
        </span>
        <ChevronIcon className="shrink-0 text-text-secondary transition-transform motion-reduce:transition-none group-aria-expanded:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul role="list" className="flex flex-wrap gap-2 pt-3">
          {ordered.map((requirement) => (
            <li key={requirement.id}>
              <Chip>{requirement.label}</Chip>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

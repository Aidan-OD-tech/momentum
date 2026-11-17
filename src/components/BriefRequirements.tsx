"use client";

import { useState } from "react";
import { Chip } from "@/components/Chip";
import { ChevronIcon } from "@/components/icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { substantiveFirst } from "@/lib/step-state";
import type { Requirement } from "@/lib/types";

// "From your brief": one line of short labels when collapsed, every requirement as a chip when expanded.
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
        <span className="flex flex-wrap items-baseline gap-x-3">
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

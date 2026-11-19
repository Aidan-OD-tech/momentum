import { Chip } from "@/components/Chip";
import { Button } from "@/components/ui/button";
import { assignmentMeta } from "@/lib/format";
import type { Assignment } from "@/lib/types";

type AssignmentRowProps = {
  assignment: Assignment;
  // The caption under the title (see src/lib/home-list.ts).
  status: string;
  // Shows "Due date passed" instead of "Due" in the meta line.
  deadlinePassed?: boolean;
  // "Review plan", "Open" or "Review". The accessible name adds the title, so a screen reader's list of
  // buttons isn't five identical "Open"s; it starts with the visible word (WCAG 2.5.3).
  actionLabel: string;
  onAction: () => void;
};

// One assignment in a home-list group (Figma "M7 · Assignment row"). Render inside a <ul>.
export function AssignmentRow({ assignment, status, deadlinePassed = false, actionLabel, onAction }: AssignmentRowProps) {
  return (
    <li className="flex items-center justify-between gap-4 border-t border-border-default py-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-caption text-text-tertiary">{assignmentMeta(assignment, deadlinePassed)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-heading-m text-text-primary">{assignment.title}</h3>
          {assignment.status === "review" && <Chip>Ready to review</Chip>}
        </div>
        <p className="text-caption text-text-secondary">{status}</p>
      </div>
      <Button variant="secondary" className="shrink-0" aria-label={`${actionLabel} ${assignment.title}`} onClick={onAction}>
        {actionLabel}
      </Button>
    </li>
  );
}

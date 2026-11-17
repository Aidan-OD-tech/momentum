import { withFullStop } from "@/lib/format";
import type { Requirement } from "@/lib/types";

// The submission requirements as a reminder, never a checkbox, with the plain statement that
// Momentum doesn't submit anything (handoff decision 2).
export function SubmissionReminder({ requirements }: { requirements: Requirement[] }) {
  const reminders = requirements.filter((requirement) => requirement.kind === "submission");
  return (
    <div className="flex flex-col gap-1 rounded-md bg-surface-subtle p-4">
      {reminders.map((requirement) => (
        <p key={requirement.id} className="text-body-strong text-text-primary">
          {withFullStop(requirement.label)}
        </p>
      ))}
      <p className="text-body text-text-secondary">Momentum doesn’t submit anything for you.</p>
    </div>
  );
}

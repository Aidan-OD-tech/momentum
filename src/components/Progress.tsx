import { cn } from "@/lib/utils";

type ProgressProps = {
  done: number;
  total: number;
  // Replaces the default "n of N steps done" text, e.g. to add "· Final check reviewed".
  label?: string;
  // The rail puts the text above the bar; cards put it below.
  labelPosition?: "above" | "below";
};

export function progressLabel(done: number, total: number): string {
  return `${done} of ${total} ${total === 1 ? "step" : "steps"} done`;
}

// One segment per step, the first `done` filled, plus a text line. Works for any total.
// The segments are decoration; the text carries the meaning for screen readers.
export function Progress({ done, total, label, labelPosition = "below" }: ProgressProps) {
  const filled = Math.min(Math.max(done, 0), total);
  return (
    <div className={cn("flex gap-2", labelPosition === "above" ? "flex-col-reverse" : "flex-col")}>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <div
            key={index}
            data-filled={index < filled}
            className={cn("h-1 flex-1 rounded-full", index < filled ? "bg-progress-fill" : "bg-progress-track")}
          />
        ))}
      </div>
      <p className="text-caption text-text-secondary">{label ?? progressLabel(filled, total)}</p>
    </div>
  );
}

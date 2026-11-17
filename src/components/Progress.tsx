import { cn } from "@/lib/utils";

type ProgressProps = {
  done: number;
  total: number;
};

// One segment per step, the first `done` filled, plus the text "n of N steps done".
// Works for any total. The segments are decoration; the text carries the meaning for screen readers.
export function Progress({ done, total }: ProgressProps) {
  const filled = Math.min(Math.max(done, 0), total);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <div
            key={index}
            data-filled={index < filled}
            className={cn("h-1 flex-1 rounded-full", index < filled ? "bg-progress-fill" : "bg-progress-track")}
          />
        ))}
      </div>
      <p className="text-caption text-text-secondary">
        {filled} of {total} {total === 1 ? "step" : "steps"} done
      </p>
    </div>
  );
}

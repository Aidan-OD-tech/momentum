import { clampEstimate } from "@/lib/reducer";

type EstimateStepperProps = {
  // Labels the group, e.g. the id of "Approximate time for the full step".
  labelledBy: string;
  minutes: number;
  onChange: (minutes: number) => void;
};

// − / "N min" / + in 5-minute steps, never below 5 (handoff "By screen" 3). The value is announced
// politely when it changes.
export function EstimateStepper({ labelledBy, minutes, onChange }: EstimateStepperProps) {
  const buttonClass =
    "flex size-8 items-center justify-center rounded-sm text-body-l text-text-primary not-aria-disabled:hover:bg-surface-subtle aria-disabled:cursor-not-allowed aria-disabled:text-text-tertiary";
  const atMinimum = minutes <= 5;
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className="flex h-button items-center gap-2 self-start rounded-sm border border-border-rule px-1"
    >
      <button
        type="button"
        aria-label="Decrease time"
        // aria-disabled rather than disabled, so keyboard focus stays on the button when it reaches 5.
        aria-disabled={atMinimum}
        onClick={() => !atMinimum && onChange(clampEstimate(minutes - 5))}
        className={buttonClass}
      >
        −
      </button>
      <output aria-live="polite" className="min-w-16 text-center text-body-l text-text-primary">
        {minutes} min
      </output>
      <button type="button" aria-label="Increase time" onClick={() => onChange(clampEstimate(minutes + 5))} className={buttonClass}>
        +
      </button>
    </div>
  );
}

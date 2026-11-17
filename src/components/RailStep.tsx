import { CheckIcon } from "@/components/icons";

type RailStepProps = {
  label: string;
  state: "done" | "current";
};

// One row in the step rail. Done: check, struck through, tertiary. Current: dot, medium weight.
export function RailStep({ label, state }: RailStepProps) {
  if (state === "done") {
    return (
      <li className="flex items-start gap-2 text-body text-text-tertiary">
        <span className="flex h-lh items-center">
          <CheckIcon />
        </span>
        <span className="line-through">
          <span className="sr-only">Done: </span>
          {label}
        </span>
      </li>
    );
  }
  return (
    <li aria-current="step" className="flex items-start gap-2 text-body-strong text-text-primary">
      <span className="flex h-lh w-4 items-center justify-center">
        <span className="size-2 rounded-full bg-text-primary" />
      </span>
      <span>{label}</span>
    </li>
  );
}

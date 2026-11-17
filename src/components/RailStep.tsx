import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type RailStepProps = {
  number: number;
  label: string;
  state: "done" | "current";
};

// One row in the step rail, linking to that step. Done: check, struck through, tertiary.
// Current: dot, medium weight, aria-current="step".
export function RailStep({ number, label, state }: RailStepProps) {
  const done = state === "done";
  return (
    <li>
      <Link
        href={`/step/${number}`}
        aria-current={done ? undefined : "step"}
        className={cn(
          "flex items-start gap-2 rounded-sm py-1",
          done ? "text-body text-text-tertiary" : "text-body-strong text-text-primary",
        )}
      >
        <span className="flex h-lh w-4 shrink-0 items-center justify-center">
          {done ? <CheckIcon /> : <span className="size-2 rounded-full bg-text-primary" />}
        </span>
        <span className={done ? "line-through" : undefined}>
          {done && <span className="sr-only">Done: </span>}
          {number}. {label}
        </span>
      </Link>
    </li>
  );
}

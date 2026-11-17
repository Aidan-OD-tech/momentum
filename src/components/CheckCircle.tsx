import { CheckIcon } from "@/components/icons";

// The dark circle with a check on step complete and the final check. Decorative.
export function CheckCircle() {
  return (
    <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-action-primary text-text-on-primary">
      <CheckIcon />
    </span>
  );
}

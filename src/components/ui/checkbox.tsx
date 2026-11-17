"use client";

import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { CheckIcon } from "@/components/icons";

// Radix Checkbox, restyled. Unchecked: input border. Checked: primary fill with a white check.
// Give it a label: wrap it in a <label> or pass aria-labelledby.
export function Checkbox(props: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className="flex size-checkbox shrink-0 items-center justify-center rounded-sm border border-border-strong bg-surface-page text-text-on-primary aria-checked:bg-action-primary"
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

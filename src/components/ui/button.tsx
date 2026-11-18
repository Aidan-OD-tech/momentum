import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Three button types from the handoff: Primary, Secondary and Tertiary (a text link).
// aria-disabled (primary only): looks disabled but stays focusable, for a button whose reason is
// described elsewhere (Start step 1 on plan review). The click handler must ignore it.
// The focus ring is not set here; globals.css gives every control the token ring on :focus-visible.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors motion-reduce:transition-none disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "h-button rounded-sm bg-action-primary px-6 text-body-strong text-text-on-primary enabled:not-aria-disabled:hover:bg-action-primary-hover disabled:bg-surface-subtle disabled:text-text-tertiary aria-disabled:cursor-not-allowed aria-disabled:bg-surface-subtle aria-disabled:text-text-tertiary",
        secondary:
          "h-button rounded-sm border border-border-input bg-surface-page px-6 text-body-strong text-text-primary enabled:hover:bg-surface-subtle disabled:text-text-tertiary",
        tertiary:
          "h-button-text rounded-sm text-link text-text-primary enabled:hover:text-text-secondary disabled:text-text-tertiary",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      fullWidth: false,
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, fullWidth, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, fullWidth }), className)}
      {...props}
    />
  );
}

export { Button };

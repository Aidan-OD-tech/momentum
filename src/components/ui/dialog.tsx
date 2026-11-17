"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

// Radix Dialog, restyled to Momentum tokens. Radix handles the focus trap, Escape and aria wiring.
// Two shapes: DialogContent (centered, 520 wide) and SheetContent (docked right, 520 wide, full height).
// Below 600px both are full width.

export const Dialog = DialogPrimitive.Root;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export const DialogClose = DialogPrimitive.Close;

type ContentProps = React.ComponentProps<typeof DialogPrimitive.Content>;

function Overlay() {
  return <DialogPrimitive.Overlay className="fixed inset-0 bg-overlay-scrim" />;
}

export function DialogContent({ className, ...props }: ContentProps) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 w-full -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface-page p-6 shadow-dialog sm:max-w-dialog",
          className,
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  );
}

export function SheetContent({ className, ...props }: ContentProps) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-y-0 right-0 w-full overflow-y-auto bg-surface-page shadow-side-panel sm:max-w-side-panel",
          className,
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  );
}

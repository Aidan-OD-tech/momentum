import { AlertIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

// Text input and text area (handoff: "Text input and text area", drawn in the frames, not as components).
// Focus shows as border/strong (handoff: "Focused or active input"), not the ring. Give each one a
// visible <label>; pass aria-invalid and aria-describedby when it has an error.

const fieldClass =
  "w-full rounded-sm border border-border-input bg-surface-page px-3 text-body-l text-text-primary placeholder:text-text-tertiary focus:border-border-strong focus-visible:shadow-none aria-invalid:border-border-strong";

export function TextInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input type="text" className={cn(fieldClass, "h-button", className)} {...props} />;
}

export function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldClass, "resize-y py-2", className)} {...props} />;
}

// The inline error under a field (Error 01 style). Link it with aria-describedby on the field.
export function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="flex items-center gap-2 text-body text-text-primary">
      <AlertIcon className="shrink-0" />
      {children}
    </p>
  );
}

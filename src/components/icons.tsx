import { cn } from "@/lib/utils";

// The six icons from the handoff: 16px, 1.5 stroke. Drawn inline so there is no icon library.
// They are decorative (aria-hidden); put the meaning in nearby text.

type IconProps = { className?: string };

function Icon({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-4", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 8.5l3.2 3.2L13 4.8" />
    </Icon>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6l4 4 4-4" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.5 1.5" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </Icon>
  );
}

export function NoteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 2.75h5.5l3 3v7.5H4z" />
      <path d="M9.5 2.75v3h3M6.25 8.5h3.5M6.25 11h3.5" />
    </Icon>
  );
}

export function SavedCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M5.5 8.2l1.7 1.7 3.3-3.4" />
    </Icon>
  );
}

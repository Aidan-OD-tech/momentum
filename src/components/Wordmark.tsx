import Link from "next/link";

// The Momentum wordmark: a small dark square and the name (top bar in Figma). A link home, so every
// screen has a way back (H-17). It looks the same; focus shows the token ring (globals.css).
export function Wordmark() {
  return (
    <Link href="/" aria-label="Momentum, home" className="flex items-center gap-2 rounded-sm text-body-strong text-text-primary">
      <span aria-hidden="true" className="size-logo rounded-sm bg-action-primary" />
      Momentum
    </Link>
  );
}

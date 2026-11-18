import { AlertIcon, SavedCheckIcon } from "@/components/icons";
import { Wordmark } from "@/components/Wordmark";
import { cn } from "@/lib/utils";

export type SaveStatus = "hidden" | "saved" | "failed";

type TopBarProps = {
  // Session: on a working, step-complete, final or review screen; shows the assignment in the middle.
  // Home: on home and completed home; no assignment context.
  mode: "home" | "session";
  // e.g. "PSYC 3024 · Urban green spaces essay". Session mode only.
  context?: string;
  // "saved" only after a storage write has succeeded (handoff decision 4).
  saveStatus?: SaveStatus;
};

export function TopBar({ mode, context, saveStatus = "hidden" }: TopBarProps) {
  return (
    <header className="flex h-top-bar shrink-0 items-center gap-4 border-b border-border-default bg-surface-page px-8">
      {/* The two outer groups share the space equally, which keeps the context centered. */}
      <div className="flex flex-1 items-center">
        <Wordmark />
      </div>
      {mode === "session" && context && <p className="min-w-0 truncate text-body text-text-secondary">{context}</p>}
      <div className="flex flex-1 items-center justify-end">
        <SaveIndicator status={saveStatus} />
      </div>
    </header>
  );
}

// One status region, always in the DOM (empty while hidden), so a screen reader hears each change
// of text: to saved, to failed, and back (WCAG 4.1.3). Writes that keep the same status change nothing,
// so nothing is announced again on every keystroke.
function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <p
      role="status"
      className={cn(
        "flex items-center gap-1 whitespace-nowrap text-caption",
        status === "failed" ? "text-text-primary" : "text-text-tertiary",
      )}
    >
      {status === "saved" && (
        <>
          <SavedCheckIcon />
          Saved in this browser
        </>
      )}
      {status === "failed" && (
        <>
          <AlertIcon />
          Couldn’t save in this browser
        </>
      )}
    </p>
  );
}

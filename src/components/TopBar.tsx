import { SavedCheckIcon } from "@/components/icons";
import { Wordmark } from "@/components/Wordmark";

export type SaveStatus = "hidden" | "saved" | "failed";

type TopBarProps =
  | { mode: "home" }
  | {
      mode: "session";
      // The assignment context shown in the middle, e.g. "PSYC 3024 · Urban green spaces essay".
      context: string;
      // Show "saved" only after a storage write has succeeded (handoff decision 4). M1 never writes, so it passes "hidden".
      saveStatus: SaveStatus;
    };

export function TopBar(props: TopBarProps) {
  return (
    <header className="flex h-top-bar items-center gap-4 border-b border-border-default px-8">
      {/* The two outer groups share the space equally, which keeps the context centered. */}
      <div className="flex flex-1 items-center">
        <Wordmark />
      </div>
      {props.mode === "session" && (
        <>
          <p className="min-w-0 truncate text-body text-text-secondary">{props.context}</p>
          <div className="flex flex-1 items-center justify-end">
            <SaveIndicator status={props.saveStatus} />
          </div>
        </>
      )}
    </header>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "hidden") return null;
  if (status === "failed") {
    return <p className="text-caption text-text-secondary">Couldn’t save in this browser</p>;
  }
  return (
    <p className="flex items-center gap-1 text-caption text-text-secondary">
      <SavedCheckIcon />
      Saved in this browser
    </p>
  );
}

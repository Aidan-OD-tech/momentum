import { NoteIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { formatSavedAt } from "@/lib/format";

type ReturnNoteProps = {
  note: string;
  savedAt: string | null;
  // shown: on the working step, with Hide note. hidden: the dashed row with Show note.
  // static: on home and in review, no action.
  variant: "shown" | "hidden" | "static";
  onHide?: () => void;
  onShow?: () => void;
};

// Return note v2 (Figma). Render it only when the step has a note.
export function ReturnNote({ note, savedAt, variant, onHide, onShow }: ReturnNoteProps) {
  if (variant === "hidden") {
    return (
      <div className="flex items-center justify-between gap-4 rounded-md border border-dashed border-border-input px-4 py-1">
        <p className="flex items-center gap-3 text-body text-text-tertiary">
          <NoteIcon />
          Your note is hidden for this step.
        </p>
        <Button variant="tertiary" onClick={onShow}>
          Show note
        </Button>
      </div>
    );
  }

  const saved = savedAt ? ` · ${formatSavedAt(savedAt)}` : "";
  const isStatic = variant === "static";
  return (
    <div
      className={
        isStatic
          ? "flex gap-3 rounded-md border border-border-default bg-surface-page p-4"
          : "flex gap-3 rounded-md border border-border-default bg-surface-sunken p-4"
      }
    >
      <span className="flex h-4 items-center text-text-secondary">
        <NoteIcon />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-label text-text-secondary">
          {isStatic ? "Your note" : "Where you left off"}
          {saved}
        </p>
        <p className="text-body-l text-text-primary">“{note}”</p>
      </div>
      {!isStatic && (
        <Button variant="tertiary" onClick={onHide} className="self-start">
          Hide note
        </Button>
      )}
    </div>
  );
}

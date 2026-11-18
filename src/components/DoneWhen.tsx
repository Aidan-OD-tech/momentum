import { capitalizeFirst } from "@/lib/format";

// The "Done when" well. `criterion` is the criterion only; the label is added here. The criterion
// stands alone as a sentence here, so its first letter is capitalized (it is stored lowercase).
export function DoneWhen({ criterion }: { criterion: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-surface-subtle p-4">
      <p className="text-caption text-text-secondary">Done when</p>
      <p className="text-body-l-strong text-text-primary">{capitalizeFirst(criterion)}</p>
    </div>
  );
}

// The "Done when" well. `criterion` is the criterion only; the label is added here.
export function DoneWhen({ criterion }: { criterion: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-surface-subtle p-4">
      <p className="text-caption text-text-secondary">Done when</p>
      <p className="text-body-l-strong text-text-primary">{criterion}</p>
    </div>
  );
}

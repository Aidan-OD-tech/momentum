// A small read-only label, used for each requirement from the brief.
export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-sm border border-border-default bg-surface-page px-3 py-1 text-caption text-text-primary">
      {children}
    </span>
  );
}

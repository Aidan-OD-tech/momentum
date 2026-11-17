// The Momentum wordmark: a small dark square and the name (top bar in Figma).
export function Wordmark() {
  return (
    <span className="flex items-center gap-2 text-body-strong text-text-primary">
      <span aria-hidden="true" className="size-logo rounded-sm bg-action-primary" />
      Momentum
    </span>
  );
}

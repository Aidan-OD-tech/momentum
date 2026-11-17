// One "What to do" line with an em-dash bullet. Use inside a <ul role="list">.
export function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-body-l text-text-primary">
      <span aria-hidden="true" className="text-text-tertiary">
        —
      </span>
      <span>{children}</span>
    </li>
  );
}

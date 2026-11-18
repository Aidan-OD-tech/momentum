"use client";

import { BulletItem } from "@/components/BulletItem";
import { AlertIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useFocusHeading } from "@/lib/use-focus-heading";

type Action = { label: string; onClick: () => void };

type ErrorCardProps = {
  heading: string;
  body: string;
  bullets?: string[];
  primary: Action;
  secondary: Action;
};

// One card for Error 02 and Error 03 (scope decision). Focus moves to the heading when it appears.
export function ErrorCard({ heading, body, bullets, primary, secondary }: ErrorCardProps) {
  const headingRef = useFocusHeading<HTMLHeadingElement>(heading);
  return (
    <div className="flex w-full max-w-error-card flex-col gap-6 rounded-lg border border-border-default bg-surface-page p-8">
      <AlertIcon className="size-6 text-text-primary" />
      <div className="flex flex-col gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-heading-l text-text-primary focus-visible:shadow-none">
          {heading}
        </h1>
        <p className="text-body-l text-text-secondary">{body}</p>
      </div>
      {bullets && (
        <ul role="list" className="flex flex-col gap-2">
          {bullets.map((bullet) => (
            <BulletItem key={bullet}>{bullet}</BulletItem>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={primary.onClick}>
          {primary.label}
        </Button>
        <Button variant="secondary" onClick={secondary.onClick}>
          {secondary.label}
        </Button>
      </div>
      <p className="text-caption text-text-tertiary">Your text is still here.</p>
    </div>
  );
}

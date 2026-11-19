"use client";

import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { useFocusHeading } from "@/lib/use-focus-heading";

// Building your plan (R3 04): one state, with no stages, no counts and no save indicator (handoff decision 4).
export function BuildingScreen({ onCancel }: { onCancel: () => void }) {
  const headingRef = useFocusHeading<HTMLHeadingElement>();
  return (
    <>
      <TopBar mode="home" />
      <main className="mx-auto flex w-full max-w-building flex-col gap-8 px-4 pt-16 pb-16">
        <div className="flex flex-col gap-2">
          <h1 ref={headingRef} tabIndex={-1} className="text-heading-l text-text-primary focus-visible:shadow-none">
            Building your plan
          </h1>
          <p className="text-body text-text-secondary">This usually takes under a minute.</p>
        </div>
        <p role="status" className="flex items-center gap-3 text-body-l text-text-primary">
          <Spinner />
          Working on it
        </p>
        <Button variant="tertiary" onClick={onCancel} className="self-start">
          Cancel
        </Button>
      </main>
    </>
  );
}

// Indeterminate: it shows that work is happening, not how much is done. Still with reduced motion.
// Also on the rows of Building your plans (M7c).
export function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 shrink-0 animate-spin rounded-full border-2 border-progress-track border-t-progress-fill motion-reduce:animate-none"
    />
  );
}

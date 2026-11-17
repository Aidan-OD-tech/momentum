import { ClockIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/lib/format";

// Optional timer, Off state only (off by default). Running, Paused, Hidden and Ended come in M2.
// `minutes` is the step estimate.
export function Timer({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <ClockIcon className="text-text-secondary" />
        <div className="flex flex-col">
          <span className="text-body-strong text-text-primary">Timer</span>
          <span className="text-caption text-text-tertiary">Optional · off</span>
        </div>
      </div>
      {/* M2: start the countdown. */}
      <Button variant="tertiary">Start a {formatMinutes(minutes)} timer</Button>
    </div>
  );
}

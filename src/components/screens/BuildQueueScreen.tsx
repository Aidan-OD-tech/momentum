"use client";

import { useRouter } from "next/navigation";
import { AlertIcon, CheckIcon, ClockIcon } from "@/components/icons";
import { Spinner } from "@/components/screens/BuildingScreen";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { type QueueItem, useBuildQueue } from "@/lib/build-queue";
import { useMomentumData } from "@/lib/momentum-store";
import { useFocusHeading } from "@/lib/use-focus-heading";

// The line for one brief. `running` tells a brief that is next in line from one left as a draft
// (after Stop after this one, or a 429).
export function queueRowText(item: QueueItem, running: boolean): string {
  switch (item.state) {
    case "ready":
      return `${item.title} · plan ready`;
    case "notSaved":
      // Development copy: the write failed, so the plan is only in this visit's memory.
      return `${item.title} · built, but not saved in this browser`;
    case "building":
      return `Brief ${item.number} · building the plan`;
    case "waiting":
      // Development copy for the stopped case.
      return running ? `Brief ${item.number} · waiting` : `Brief ${item.number} · not built yet`;
    case "failed":
      return item.reason === "unreadable" ? `Brief ${item.number} · couldn’t find clear requirements` : `Brief ${item.number} · couldn’t build this plan`;
  }
}

function RowIcon({ item }: { item: QueueItem }) {
  if (item.state === "building") return <Spinner />;
  if (item.state === "ready") return <CheckIcon className="shrink-0" />;
  if (item.state === "waiting") return <ClockIcon className="shrink-0 text-text-tertiary" />;
  return <AlertIcon className="shrink-0" />;
}

// /new while a week's plans are being built, and after, until the student leaves (M7-3). One row per
// brief with text, in card order. Each plan is saved as it arrives; nothing here counts down.
export function BuildQueueScreen({ onEditBriefs }: { onEditBriefs: () => void }) {
  const queue = useBuildQueue();
  const { saveStatus } = useMomentumData();
  const router = useRouter();
  const headingRef = useFocusHeading<HTMLHeadingElement>();
  const { items, running } = queue;
  const goToList = () => router.push("/");

  return (
    <>
      <TopBar mode="home" saveStatus={saveStatus} />
      <main className="mx-auto flex w-full max-w-building flex-col gap-8 px-4 pt-16 pb-16">
        <div className="flex flex-col gap-2">
          <h1 ref={headingRef} tabIndex={-1} className="text-heading-l text-text-primary focus-visible:shadow-none">
            Building your plans
          </h1>
          <p className="text-body text-text-secondary">
            One at a time. Each usually takes under a minute. Keep this tab open; each plan is saved in this browser as soon as it’s
            ready.
          </p>
        </div>

        <ul role="list" className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.draftId} className="flex items-start gap-3">
              <span className="flex h-lh items-center text-body-l text-text-primary">
                <RowIcon item={item} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-body-l text-text-primary">{queueRowText(item, running)}</p>
                {item.state === "failed" && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <p className="text-body text-text-secondary">
                      {item.reason === "unreadable" ? "Your brief is kept. Edit it and try again." : "Your brief is kept."}
                    </p>
                    {item.reason === "unreadable" ? (
                      // Back to entry only once nothing is being built, so no brief is edited while it's sent.
                      !running && (
                        <Button variant="tertiary" aria-label={`Edit brief ${item.number}`} onClick={onEditBriefs}>
                          Edit brief
                        </Button>
                      )
                    ) : (
                      <Button variant="tertiary" aria-label={`Try again: brief ${item.number}`} onClick={() => queue.retry(item.draftId)}>
                        Try again
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Says each change of a brief's state once (each change is a new line), never a ticking message. */}
        <div role="status" className="sr-only">
          {queue.changes.map((change) => (
            <p key={change.seq}>{queueRowText(change.item, true)}</p>
          ))}
        </div>

        {queue.rateLimited && (
          // The M6 rate-limit line (decisions.md, M6, item 5). No automatic retry.
          <p className="rounded-md bg-surface-subtle p-4 text-body text-text-primary">
            Too many plans were built from this network. Try again in about 10 minutes.
          </p>
        )}

        {running ? (
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="secondary" onClick={goToList}>
              Go to your assignments
            </Button>
            {queue.stopRequested ? (
              // Development copy.
              <p className="text-caption text-text-secondary">Stopping after this one.</p>
            ) : (
              <Button variant="tertiary" onClick={queue.stopAfterCurrent}>
                Stop after this one
              </Button>
            )}
          </div>
        ) : (
          <Button variant="primary" className="self-start" onClick={goToList}>
            Go to your assignments
          </Button>
        )}
      </main>
    </>
  );
}

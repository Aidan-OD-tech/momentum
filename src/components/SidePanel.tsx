"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Chip } from "@/components/Chip";
import { CloseIcon } from "@/components/icons";
import { PlanStepRow } from "@/components/PlanStepRow";
import { Dialog, DialogClose, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTotalMinutes } from "@/lib/format";
import { useMomentum } from "@/lib/momentum-store";
import { substantiveFirst, totalEstimateMinutes } from "@/lib/step-state";

// The side panel with the Plan and Original brief tabs (Panel 01, Panel 02).
// It opens over the current screen without navigating; any screen can open it with usePanel().

export type PanelTab = "plan" | "brief";

const PanelContext = createContext<{ openPanel: (tab: PanelTab) => void } | null>(null);

export function usePanel() {
  const context = useContext(PanelContext);
  if (!context) throw new Error("usePanel must be used inside <SidePanelProvider>");
  return context;
}

export function SidePanelProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PanelTab>("plan");
  // The button that opened the panel, so focus can go back to it on close.
  const returnFocusTo = useRef<HTMLElement | null>(null);

  const openPanel = useCallback((next: PanelTab) => {
    returnFocusTo.current = document.activeElement as HTMLElement | null;
    setTab(next);
    setOpen(true);
  }, []);

  return (
    <PanelContext.Provider value={{ openPanel }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <SheetContent
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusTo.current?.focus();
          }}
        >
          <PanelBody tab={tab} onTabChange={setTab} />
        </SheetContent>
      </Dialog>
    </PanelContext.Provider>
  );
}

function PanelBody({ tab, onTabChange }: { tab: PanelTab; onTabChange: (tab: PanelTab) => void }) {
  const { assignment } = useMomentum();
  const stepCount = assignment.steps.length;

  return (
    <Tabs value={tab} onValueChange={(value) => onTabChange(value as PanelTab)} className="flex flex-col gap-6 p-6">
      <DialogTitle className="sr-only">{assignment.title}: plan and original brief</DialogTitle>
      <div className="flex items-center justify-between gap-4">
        <TabsList aria-label="Panel">
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="brief">Original brief</TabsTrigger>
        </TabsList>
        <DialogClose aria-label="Close" className="flex size-8 items-center justify-center rounded-sm text-text-secondary">
          <CloseIcon />
        </DialogClose>
      </div>

      <TabsContent value="plan" className="flex flex-col gap-4">
        <p className="text-body text-text-secondary">
          {assignment.title} · {stepCount} {stepCount === 1 ? "step" : "steps"} · about{" "}
          {formatTotalMinutes(totalEstimateMinutes(assignment))} in total, approximate
        </p>
        <ol className="border-b border-border-default">
          {assignment.steps.map((step, index) => (
            <PlanStepRow key={step.id} number={index + 1} step={step} />
          ))}
        </ol>
        {/* Plan review is the only place steps can be edited, and it can't be reached once the plan has
            started (decisions.md, M3 "Don't build"). Started-plan wording pending Aidan's approval (M6). */}
        <p className="text-caption text-text-tertiary">
          {assignment.status === "review"
            ? "To change steps, edit the plan from the plan review."
            : "Steps can’t be changed after you start."}
        </p>
      </TabsContent>

      <TabsContent value="brief" className="flex flex-col gap-4">
        <h2 className="text-label text-text-secondary">Requirements we found</h2>
        <ul role="list" className="flex flex-wrap gap-2">
          {substantiveFirst(assignment.requirements).map((requirement) => (
            <li key={requirement.id}>
              <Chip>{requirement.label}</Chip>
            </li>
          ))}
        </ul>
        <div className="rounded-md border border-border-default bg-surface-sunken p-4 text-body-l whitespace-pre-line text-text-primary">
          {assignment.brief}
        </div>
        <p className="text-caption text-text-tertiary">
          This is the brief you pasted. Momentum keeps a copy so you can check it while you work.
        </p>
      </TabsContent>
    </Tabs>
  );
}

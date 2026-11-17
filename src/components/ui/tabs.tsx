"use client";

import { Tabs as TabsPrimitive } from "radix-ui";

// Radix Tabs, restyled as a segmented control (Panel 01 and 02). Radix handles arrow keys and aria.
export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export function TabsList(props: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className="inline-flex gap-1 rounded-md bg-surface-subtle p-1" {...props} />;
}

export function TabsTrigger(props: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className="h-button-text rounded-sm px-3 text-body text-text-secondary aria-selected:bg-surface-page aria-selected:text-body-strong aria-selected:text-text-primary"
      {...props}
    />
  );
}

"use client";

import { SidePanelProvider } from "@/components/SidePanel";
import { BuildQueueProvider } from "@/lib/build-queue";
import { MomentumProvider } from "@/lib/momentum-store";

// The app-wide state (stored in this browser), the queue that builds a week's plans (in memory), and
// the side panel any screen can open.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MomentumProvider>
      <BuildQueueProvider>
        <SidePanelProvider>{children}</SidePanelProvider>
      </BuildQueueProvider>
    </MomentumProvider>
  );
}

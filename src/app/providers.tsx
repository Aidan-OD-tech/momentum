"use client";

import { SidePanelProvider } from "@/components/SidePanel";
import { MomentumProvider } from "@/lib/momentum-store";

// The app-wide state (stored in this browser) and the side panel any screen can open.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MomentumProvider>
      <SidePanelProvider>{children}</SidePanelProvider>
    </MomentumProvider>
  );
}

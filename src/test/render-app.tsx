import { render } from "@testing-library/react";
import { SidePanelProvider } from "@/components/SidePanel";
import { BuildQueueProvider } from "@/lib/build-queue";
import { MomentumProvider, WhenLoaded } from "@/lib/momentum-store";
import { createSamplePlan } from "@/data/sample-assignment";
import { PlanSourceProvider, type PlanSource } from "@/lib/plan-source";

// Answers every build with the sample plan, without any network.
export const samplePlanStub: PlanSource = { build: async () => ({ ok: true, plan: createSamplePlan() }) };

// The app's providers (as in providers.tsx) with an injectable plan source.
export function AppProviders({ source = samplePlanStub, children }: { source?: PlanSource; children: React.ReactNode }) {
  return (
    <MomentumProvider>
      <BuildQueueProvider>
        <SidePanelProvider>
          <PlanSourceProvider source={source}>{children}</PlanSourceProvider>
        </SidePanelProvider>
      </BuildQueueProvider>
    </MomentumProvider>
  );
}

// Renders a screen inside the app's providers, with storage already read and an injectable plan source.
export function renderApp(screen: React.ReactNode, source: PlanSource = samplePlanStub) {
  return render(
    <AppProviders source={source}>
      <WhenLoaded>{screen}</WhenLoaded>
    </AppProviders>,
  );
}

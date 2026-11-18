import { render } from "@testing-library/react";
import { SidePanelProvider } from "@/components/SidePanel";
import { MomentumProvider, WhenLoaded } from "@/lib/momentum-store";
import { createSamplePlan } from "@/data/sample-assignment";
import { PlanSourceProvider, type PlanSource } from "@/lib/plan-source";

// Answers every build with the sample plan, without any network.
export const samplePlanStub: PlanSource = { build: async () => ({ ok: true, plan: createSamplePlan() }) };

// Renders a screen inside the app's providers, with storage already read and an injectable plan source.
export function renderApp(screen: React.ReactNode, source: PlanSource = samplePlanStub) {
  return render(
    <MomentumProvider>
      <SidePanelProvider>
        <PlanSourceProvider source={source}>
          <WhenLoaded>{screen}</WhenLoaded>
        </PlanSourceProvider>
      </SidePanelProvider>
    </MomentumProvider>,
  );
}

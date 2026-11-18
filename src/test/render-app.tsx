import { render } from "@testing-library/react";
import { SidePanelProvider } from "@/components/SidePanel";
import { MomentumProvider, WhenLoaded } from "@/lib/momentum-store";
import { PlanSourceProvider, samplePlanSource, type PlanSource } from "@/lib/plan-source";

// Renders a screen inside the app's providers, with storage already read and an injectable plan source.
export function renderApp(screen: React.ReactNode, source: PlanSource = samplePlanSource) {
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

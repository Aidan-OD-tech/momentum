import { notFound } from "next/navigation";
import { StepScreen } from "@/components/screens/StepScreen";
import { WhenStarted } from "@/lib/momentum-store";
import { parseStepParam } from "@/lib/step-state";

// A malformed step number (/step/abc, /step/03) is a real 404 here on the server.
// Whether a well-formed number exists in the plan is checked in the browser, where the plan is stored.
export default async function StepPage({ params }: { params: Promise<{ n: string }> }) {
  const n = parseStepParam((await params).n);
  if (n === null) notFound();
  return (
    <WhenStarted>
      <StepScreen n={n} />
    </WhenStarted>
  );
}

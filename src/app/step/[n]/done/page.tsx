import { notFound } from "next/navigation";
import { StepCompleteScreen } from "@/components/screens/StepCompleteScreen";
import { WhenStarted } from "@/lib/momentum-store";
import { parseStepParam } from "@/lib/step-state";

export default async function StepDonePage({ params }: { params: Promise<{ n: string }> }) {
  const n = parseStepParam((await params).n);
  if (n === null) notFound();
  return (
    <WhenStarted>
      <StepCompleteScreen n={n} />
    </WhenStarted>
  );
}

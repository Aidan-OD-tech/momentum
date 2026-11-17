import { notFound } from "next/navigation";
import { StepCompleteScreen } from "@/components/screens/StepCompleteScreen";
import { WhenLoaded } from "@/lib/momentum-store";
import { parseStepParam } from "@/lib/step-state";

export default async function StepDonePage({ params }: { params: Promise<{ n: string }> }) {
  const n = parseStepParam((await params).n);
  if (n === null) notFound();
  return (
    <WhenLoaded>
      <StepCompleteScreen n={n} />
    </WhenLoaded>
  );
}

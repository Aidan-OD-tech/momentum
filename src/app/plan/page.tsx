import { PlanReviewScreen } from "@/components/screens/PlanReviewScreen";
import { WhenLoaded } from "@/lib/momentum-store";

export default function PlanPage() {
  return (
    <WhenLoaded>
      <PlanReviewScreen />
    </WhenLoaded>
  );
}

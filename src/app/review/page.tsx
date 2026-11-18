import { WhenStarted } from "@/lib/momentum-store";
import { ReviewScreen } from "@/components/screens/ReviewScreen";

export default function ReviewPage() {
  return (
    <WhenStarted>
      <ReviewScreen />
    </WhenStarted>
  );
}

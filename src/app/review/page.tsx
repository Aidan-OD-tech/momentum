import { WhenLoaded } from "@/lib/momentum-store";
import { ReviewScreen } from "@/components/screens/ReviewScreen";

export default function ReviewPage() {
  return (
    <WhenLoaded>
      <ReviewScreen />
    </WhenLoaded>
  );
}

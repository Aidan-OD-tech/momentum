import { WhenLoaded } from "@/lib/momentum-store";
import { FinalCheckScreen } from "@/components/screens/FinalCheckScreen";

export default function FinalPage() {
  return (
    <WhenLoaded>
      <FinalCheckScreen />
    </WhenLoaded>
  );
}

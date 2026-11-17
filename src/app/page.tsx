import { WhenLoaded } from "@/lib/momentum-store";
import { HomeScreen } from "@/components/screens/HomeScreen";

export default function HomePage() {
  return (
    <WhenLoaded>
      <HomeScreen />
    </WhenLoaded>
  );
}

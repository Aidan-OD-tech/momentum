import { HomeRoute } from "@/components/screens/HomeRoute";
import { WhenLoaded } from "@/lib/momentum-store";

export default function HomePage() {
  return (
    <WhenLoaded>
      <HomeRoute />
    </WhenLoaded>
  );
}

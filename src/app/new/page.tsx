import { BriefFlow } from "@/components/screens/BriefFlow";
import { WhenLoaded } from "@/lib/momentum-store";

// Brief entry for another assignment ("Add assignments" on the home list).
export default function NewAssignmentPage() {
  return (
    <WhenLoaded>
      <BriefFlow />
    </WhenLoaded>
  );
}

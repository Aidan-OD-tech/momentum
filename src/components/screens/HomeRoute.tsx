"use client";

import { useState } from "react";
import { BriefFlow } from "@/components/screens/BriefFlow";
import { HomeListScreen } from "@/components/screens/HomeListScreen";
import { useMomentumData } from "@/lib/momentum-store";

// "/": brief entry on first run (no assignments at all), otherwise the home list. Plans in review
// are on the list as "Ready to review"; there is no redirect to /plan.
export function HomeRoute() {
  const { data } = useMomentumData();
  // Decided once, when "/" opens: a plan built from first-run brief entry goes to /plan itself,
  // so the list must not flash up in between.
  const [firstRun] = useState(data.assignments.length === 0);
  return firstRun ? <BriefFlow /> : <HomeListScreen />;
}

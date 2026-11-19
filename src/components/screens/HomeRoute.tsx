"use client";

import { useState } from "react";
import { BriefFlow } from "@/components/screens/BriefFlow";
import { HomeListScreen } from "@/components/screens/HomeListScreen";
import { useBuildQueue } from "@/lib/build-queue";
import { useMomentumData } from "@/lib/momentum-store";

// "/": brief entry on first run (no assignments at all), otherwise the home list. Plans in review
// are on the list as "Ready to review"; there is no redirect to /plan.
export function HomeRoute() {
  const { data } = useMomentumData();
  const queue = useBuildQueue();
  // Decided once, when "/" opens: a plan built from first-run brief entry goes to /plan itself,
  // so the list must not flash up in between. While a week's plans are being built, it's the list
  // (with its building line), even before the first plan is ready.
  const [firstRun] = useState(data.assignments.length === 0 && !queue.running);
  return firstRun ? <BriefFlow /> : <HomeListScreen />;
}

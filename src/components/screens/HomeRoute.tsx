"use client";

import { BriefFlow } from "@/components/screens/BriefFlow";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { useMomentumData } from "@/lib/momentum-store";
import { useRedirect } from "@/lib/use-redirect";

// "/" shows one of three things: brief entry when no assignment is open, the plan review (at /plan)
// while a plan hasn't started, or home once it has.
export function HomeRoute() {
  const { assignment } = useMomentumData();
  const inReview = assignment?.status === "review";
  useRedirect(inReview ? "/plan" : null);
  if (!assignment) return <BriefFlow />;
  if (inReview) return null;
  return <HomeScreen />;
}

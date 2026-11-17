"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Sends the browser to `to` when it isn't null. Screens use it when their route doesn't fit the
// current state (e.g. /final while steps remain) and render nothing meanwhile.
export function useRedirect(to: string | null) {
  const router = useRouter();
  useEffect(() => {
    if (to) router.replace(to);
  }, [to, router]);
}

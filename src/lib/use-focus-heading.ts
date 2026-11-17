"use client";

import { useEffect, useRef } from "react";

// Moves keyboard and screen-reader focus to the page's h1 when a screen opens, so a route change
// is announced. Give the h1 tabIndex={-1}. Pass a key (e.g. the step number) to refocus when it changes.
export function useFocusHeading<T extends HTMLElement>(key?: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [key]);
  return ref;
}

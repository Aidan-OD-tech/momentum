"use client";

import { createContext, useContext } from "react";
import type { PlanDraft } from "@/lib/types";

// Where plans come from. The app uses apiPlanSource, which asks the server route POST /api/plan.
// Screens get the source from context, so tests can inject a stub.

export type BuildInput = { brief: string; deadline?: string };

export type BuildResult =
  | { ok: true; plan: PlanDraft }
  // unreadable: Error 02. failed: Error 03. rateLimited: Error 03 with its own line (429).
  | { ok: false; reason: FailureReason };

export type FailureReason = "unreadable" | "failed" | "rateLimited";

export interface PlanSource {
  build(input: BuildInput, signal: AbortSignal): Promise<BuildResult>;
}

// Sends the brief to the server route. 200 is a plan, 422 is Error 02, 429 is the rate limit, and
// anything else, including a network error or Cancel (the signal aborts the request), is Error 03.
// No retries.
export const apiPlanSource: PlanSource = {
  async build(input, signal) {
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal,
      });
      if (response.status === 200) {
        const body = (await response.json()) as { plan: PlanDraft };
        return { ok: true, plan: body.plan };
      }
      if (response.status === 422) return { ok: false, reason: "unreadable" };
      if (response.status === 429) return { ok: false, reason: "rateLimited" };
      return { ok: false, reason: "failed" };
    } catch {
      return { ok: false, reason: "failed" };
    }
  },
};

// Never resolves on its own; it settles as "failed" only when the signal aborts (Cancel).
function waitForAbort(signal: AbortSignal): Promise<BuildResult> {
  return new Promise((resolve) => signal.addEventListener("abort", () => resolve({ ok: false, reason: "failed" })));
}

// Development only, for screenshots: "/?simulate=unreadable|failed|slow" replaces the source.
// Returns null in a production build, or when the parameter is missing or unknown.
export function simulatedSource(search: string, nodeEnv: string | undefined = process.env.NODE_ENV): PlanSource | null {
  if (nodeEnv !== "development") return null;
  const mode = new URLSearchParams(search).get("simulate");
  if (mode === "unreadable" || mode === "failed") return { build: async () => ({ ok: false, reason: mode }) };
  if (mode === "slow") return { build: (_, signal) => waitForAbort(signal) };
  return null;
}

const PlanSourceContext = createContext<PlanSource>(apiPlanSource);

export function PlanSourceProvider({ source, children }: { source: PlanSource; children: React.ReactNode }) {
  return <PlanSourceContext.Provider value={source}>{children}</PlanSourceContext.Provider>;
}

export function usePlanSource(): PlanSource {
  return useContext(PlanSourceContext);
}

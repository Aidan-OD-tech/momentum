"use client";

import { createContext, useContext } from "react";
import { createSamplePlan, sampleAssignment } from "@/data/sample-assignment";
import type { PlanDraft } from "@/lib/types";

// Where plans come from. M3 has one source that can only build the sample plan; M4 adds a
// server-side model source behind the same interface. Screens get the source from context,
// so tests can inject a stub.

export type BuildInput = { brief: string; deadline?: string };

export type BuildResult =
  | { ok: true; plan: PlanDraft }
  // unreadable: Error 02. failed: Error 03. sampleOnly: the M3-only notice on brief entry.
  | { ok: false; reason: "unreadable" | "failed" | "sampleOnly" };

export interface PlanSource {
  build(input: BuildInput, signal: AbortSignal): Promise<BuildResult>;
}

// Straight quotes and one space everywhere, so a sample brief pasted with different line breaks
// or quote styles still counts as the sample.
export function normalizeBrief(text: string): string {
  return text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
}

// TEMPORARY (M3 only; remove in M4). Builds the sample plan from the sample brief and nothing else.
// No fake delay: the building state shows for as long as this takes, which is a moment.
export const samplePlanSource: PlanSource = {
  async build({ brief }) {
    if (normalizeBrief(brief) === normalizeBrief(sampleAssignment.brief)) return { ok: true, plan: createSamplePlan() };
    return { ok: false, reason: "sampleOnly" };
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

const PlanSourceContext = createContext<PlanSource>(samplePlanSource);

export function PlanSourceProvider({ source, children }: { source: PlanSource; children: React.ReactNode }) {
  return <PlanSourceContext.Provider value={source}>{children}</PlanSourceContext.Provider>;
}

export function usePlanSource(): PlanSource {
  return useContext(PlanSourceContext);
}

import { describe, expect, it } from "vitest";
import { createSamplePlan, sampleAssignment } from "@/data/sample-assignment";
import { samplePlanSource, simulatedSource } from "@/lib/plan-source";

const build = (brief: string) => samplePlanSource.build({ brief }, new AbortController().signal);

describe("samplePlanSource", () => {
  it("builds the sample plan from the sample brief", async () => {
    expect(await build(sampleAssignment.brief)).toEqual({ ok: true, plan: createSamplePlan() });
  });

  it("matches the sample brief with different whitespace and straight quotes", async () => {
    const reflowed = sampleAssignment.brief.replace(/\n+/g, "  \n\n ").replace(/’/g, "'") + "\n\n";
    expect((await build(`  ${reflowed}`)).ok).toBe(true);
  });

  it("answers sampleOnly for any other text (never unreadable)", async () => {
    expect(await build("Write a lab report on enzyme kinetics.")).toEqual({ ok: false, reason: "sampleOnly" });
  });
});

describe("simulatedSource (?simulate=)", () => {
  it.each(["unreadable", "failed"] as const)("in development, %s returns that result", async (mode) => {
    const source = simulatedSource(`?simulate=${mode}`, "development");
    expect(await source!.build({ brief: "x" }, new AbortController().signal)).toEqual({ ok: false, reason: mode });
  });

  it("in development, slow waits until the build is cancelled", async () => {
    const controller = new AbortController();
    const result = simulatedSource("?simulate=slow", "development")!.build({ brief: "x" }, controller.signal);
    controller.abort();
    expect(await result).toEqual({ ok: false, reason: "failed" });
  });

  it.each(["production", "test", undefined])("is ignored when NODE_ENV is %s", (env) => {
    expect(simulatedSource("?simulate=failed", env)).toBeNull();
  });

  it("is ignored without the parameter or with an unknown value", () => {
    expect(simulatedSource("", "development")).toBeNull();
    expect(simulatedSource("?simulate=boom", "development")).toBeNull();
  });
});

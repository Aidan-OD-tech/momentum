import { z } from "zod";
import type { PlanDraft, PlanStep, Requirement } from "@/lib/types";

// The shapes that cross the server route, written once in zod.
// - PlanRequest: what the browser sends to POST /api/plan.
// - ModelPlan: what the model must return. OpenAI's strict Structured Outputs need every field
//   present, so missing values are `null`, never left out.
// The product rules (rounding, step limits, ordering) live in toPlanDraft, not in the schema,
// so the model can't break them.

export const PlanRequestSchema = z
  .object({
    brief: z.string(),
    // The student's deadline field. Not sent to the model: the browser applies it over the plan's.
    deadline: z.string().max(32).optional(),
    // The browser's local date, "YYYY-MM-DD", so relative dates in the brief resolve against the
    // student's day (H-05). A missing or malformed value becomes undefined, not a 400: the server then
    // uses its own UTC date, as before M6. The one-day window is checked by resolveToday().
    today: z.iso.date().optional().catch(undefined),
  })
  .strict();

export const ModelPlanSchema = z.object({
  readable: z.boolean(),
  title: z.string(),
  course: z.string().nullable(),
  summary: z.string(),
  // "YYYY-MM-DDTHH:mm", or "YYYY-MM-DD" when the brief gives a date but no time.
  deadline: z.string().nullable(),
  requirements: z.array(
    z.object({
      label: z.string(),
      shortLabel: z.string().nullable(),
      kind: z.enum(["substantive", "format", "submission"]),
    }),
  ),
  steps: z.array(
    z.object({
      title: z.string(),
      intro: z.string().nullable(),
      whatToDo: z.array(z.string()),
      doneWhen: z.string(),
      estimateMin: z.number(),
    }),
  ),
});

export type ModelPlan = z.infer<typeof ModelPlanSchema>;

export const MIN_STEPS = 1;
export const MAX_STEPS = 12;

// Nearest 5 minutes, at least 5.
export function roundEstimate(minutes: number): number {
  if (!Number.isFinite(minutes)) return 5;
  return Math.max(5, Math.round(minutes / 5) * 5);
}

// Keeps a deadline only if it is a real date in one of the two shapes; anything else becomes
// undefined (no deadline) rather than rejecting the plan.
export function cleanDeadline(value: string | null): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value?.trim() ?? "");
  if (!match) return undefined;
  const [year, month, day] = match.slice(1, 4).map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return undefined;
  if (match[4] !== undefined && (Number(match[4]) > 23 || Number(match[5]) > 59)) return undefined;
  return match[0];
}

const ORDER: Record<Requirement["kind"], number> = { substantive: 0, format: 1, submission: 2 };

// "Use APA 7th edition. " -> "Use APA 7th edition", so requirement chips don't end in a full stop.
export function withoutFullStop(text: string): string {
  return text.trim().replace(/\.+$/, "").trim();
}

// "Submit the essay", "submit your PDF": a title for handing work in. The final submission is a
// reminder, never a step; the prompt says so, and toPlanDraft drops a last step like this as a backstop.
export function isSubmitStep(title: string): boolean {
  return /^submit/i.test(title.trim());
}

// Turns the model's answer into the app's PlanDraft, adding IDs and applying the product rules.
// Returns null when the plan can't be used, which the route answers as Error 02 (unreadable).
export function toPlanDraft(model: ModelPlan): PlanDraft | null {
  if (!model.readable) return null;

  const requirements = model.requirements
    .map((r) => ({ label: withoutFullStop(r.label), shortLabel: withoutFullStop(r.shortLabel ?? "") || undefined, kind: r.kind }))
    .filter((r) => r.label !== "")
    // Substantive first, then format, then the submission reminder. sort() keeps the model's order within a kind.
    .sort((a, b) => ORDER[a.kind] - ORDER[b.kind])
    .map((r, index): Requirement => ({ id: `r${index + 1}`, ...r }));

  // A plan needs at least one thing to check in the final check.
  if (!requirements.some((r) => r.kind !== "submission")) return null;

  // Only the last step is dropped, and only if it is a Submit step: an earlier one is an interim
  // milestone (a draft for peer feedback). Dropped before IDs and the step count, so the plan still
  // needs 1 to 12 steps without it.
  const steps = model.steps
    .filter((s, index, all) => !(index === all.length - 1 && isSubmitStep(s.title)))
    .map((s, index): PlanStep => ({
      id: `s${index + 1}`,
      title: s.title.trim(),
      intro: s.intro?.trim() || undefined,
      whatToDo: s.whatToDo.map((item) => item.trim()).filter((item) => item !== ""),
      doneWhen: s.doneWhen.trim(),
      estimateMin: roundEstimate(s.estimateMin),
    }));
  if (steps.length < MIN_STEPS || steps.length > MAX_STEPS) return null;
  // Title and Done when are required, as in the step edit card.
  if (steps.some((s) => s.title === "" || s.doneWhen === "")) return null;

  const title = model.title.trim();
  if (title === "") return null;

  return {
    title,
    course: model.course?.trim() || undefined,
    summary: model.summary.trim(),
    deadline: cleanDeadline(model.deadline),
    requirements,
    steps,
  };
}

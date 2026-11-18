import { createSampleAssignment } from "@/data/sample-assignment";
import type { Assignment, MomentumData, Step } from "@/lib/types";

// Test data: the sample assignment with `stepCount` steps (copies of the sample steps, renamed),
// with any fields replaced by `overrides`.
export function makeAssignment(id: string, stepCount = 6, overrides: Partial<Assignment> = {}): Assignment {
  const base = createSampleAssignment(id);
  const steps: Step[] = Array.from({ length: stepCount }, (_, index) => ({
    ...base.steps[index % base.steps.length],
    id: `s${index + 1}`,
    title: `Step title ${index + 1}`,
  }));
  return { ...base, steps, ...overrides };
}

export function makeData(stepCount = 6): MomentumData {
  return { version: 1, activeAssignmentId: "a1", assignments: [makeAssignment("a1", stepCount)] };
}

// A Storage stand-in for tests. Pass failSet to make every setItem throw, like a full or blocked store.
export function memoryStorage(initial: Record<string, string> = {}, options: { failSet?: boolean } = {}): Storage {
  const items = new Map(Object.entries(initial));
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => {
      if (options.failSet) throw new DOMException("full", "QuotaExceededError");
      items.set(key, String(value));
    },
  };
}

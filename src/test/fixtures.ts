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

// Steps of 30 min each with the given statuses, for home-list tests: ["done", "inProgress", "upcoming"].
function stepsWith(statuses: Step["status"][]): Step[] {
  return makeAssignment("x", statuses.length).steps.map((step, index) => ({ ...step, status: statuses[index], estimateMin: 30 }));
}

// The "now" the mixed home list is written for: Wednesday Nov 18, 2026, noon, local time.
export const HOME_LIST_NOW = new Date(2026, 10, 18, 12, 0);

// A mixed home list (M7b): one of each current state plus two finished, with plans of 1, 3 and 9 steps.
// Priority order: lab (deadline passed), problems (review), reading (date only), essay (all steps done),
// then portfolio (no deadline). Finished, newest first: bibliography, quiz. The open one is the essay,
// so tests can check that buttons open their own assignment first.
export function mixedHomeList(): MomentumData {
  const a = (id: string, overrides: Partial<Assignment>) => ({ ...makeAssignment(id, 1), planCreatedAt: "2026-11-15T10:00:00.000Z", ...overrides });
  const lab = stepsWith(["done", "inProgress", "upcoming"]);
  lab[1] = { ...lab[1], note: "Halfway through the method section", noteSavedAt: new Date(2026, 10, 17, 20, 0).toISOString() };
  return {
    version: 1,
    activeAssignmentId: "essay",
    assignments: [
      a("essay", { title: "Urban green spaces essay", course: "PSYC 3024", deadline: "2026-12-04T17:00", steps: stepsWith(["done", "done", "done"]) }),
      a("portfolio", {
        title: "Portfolio reflection",
        course: "DES 2100",
        deadline: undefined,
        steps: stepsWith(["done", "done", "done", "done", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"]),
      }),
      a("problems", { status: "review", title: "Problem set 6", course: "MATH 2210", deadline: "2026-11-20T09:00", steps: stepsWith(Array(9).fill("upcoming")) }),
      a("bibliography", {
        status: "completed",
        title: "Annotated bibliography",
        course: "HIST 1050",
        deadline: "2026-11-11T23:59",
        steps: stepsWith(["done", "done", "done"]),
        completedAt: new Date(2026, 10, 10, 15, 0).toISOString(),
        finalReviewedAt: new Date(2026, 10, 10, 15, 0).toISOString(),
      }),
      a("lab", { title: "Lab report 4", course: "CHEM 2010", deadline: "2026-11-16T17:00", steps: lab }),
      a("quiz", { status: "completed", title: "Quiz prep", course: "BIOL 1001", deadline: undefined, steps: stepsWith(["done"]), completedAt: new Date(2026, 9, 2, 9, 0).toISOString() }),
      a("reading", { title: "Reading response", course: "ENGL 1102", deadline: "2026-11-24", steps: stepsWith(["upcoming"]) }),
    ],
  };
}

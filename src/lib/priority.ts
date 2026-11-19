import { parseDeadline } from "@/lib/format";
import type { Assignment } from "@/lib/types";

// The order of the home list (M7, Aidan 2026-11-18). Deadline first; see docs/decisions.md.
// Pure functions, no React.

// Minutes of steps not done. A step in progress counts in full: Momentum doesn't track partial work.
export function remainingMinutes(assignment: Assignment): number {
  return assignment.steps.filter((step) => step.status !== "done").reduce((total, step) => total + step.estimateMin, 0);
}

// The deadline as a local time in ms, or null when there is none or it isn't a valid date.
// A date-only deadline counts as 23:59 that day.
function deadlineTime(assignment: Assignment): number | null {
  const parts = assignment.deadline ? parseDeadline(assignment.deadline) : null;
  if (!parts) return null;
  const { hour, minute } = parts.time ?? { hour: 23, minute: 59 };
  return new Date(parts.year, parts.month - 1, parts.day, hour, minute).getTime();
}

// True when the assignment has a valid deadline. Without one, it goes in the home list's "No deadline" group.
export function hasDeadline(assignment: Assignment): boolean {
  return deadlineTime(assignment) !== null;
}

// True when the deadline is before `now`. The home list says "Due date passed", with no warning.
export function deadlinePassed(assignment: Assignment, now: Date): boolean {
  const due = deadlineTime(assignment);
  return due !== null && due < now.getTime();
}

// Negative when a comes first. 0 keeps the array order (Array.prototype.sort is stable).
function compareCurrent(a: Assignment, b: Assignment): number {
  const [aDue, bDue] = [deadlineTime(a), deadlineTime(b)];
  // 1. With a deadline before without.
  if (aDue !== null && bDue === null) return -1;
  if (aDue === null && bDue !== null) return 1;
  if (aDue !== null && bDue !== null) {
    // 2. Earliest deadline first. A passed deadline isn't special: it is simply earliest.
    if (aDue !== bDue) return aDue - bDue;
    // 3. Same deadline: more work left first.
    return remainingMinutes(b) - remainingMinutes(a);
  }
  // 4. No deadline: the plan made first comes first. Plans from before M5 have no planCreatedAt and go last.
  if (a.planCreatedAt && !b.planCreatedAt) return -1;
  if (!a.planCreatedAt && b.planCreatedAt) return 1;
  if (a.planCreatedAt && b.planCreatedAt) return Date.parse(a.planCreatedAt) - Date.parse(b.planCreatedAt);
  return 0;
}

// Not completed (status "review" or "active"), in home-list order.
export function currentAssignments(assignments: Assignment[]): Assignment[] {
  return assignments.filter((assignment) => assignment.status !== "completed").sort(compareCurrent);
}

// Status "completed", newest completedAt first.
export function finishedAssignments(assignments: Assignment[]): Assignment[] {
  const completedTime = (assignment: Assignment) => (assignment.completedAt ? Date.parse(assignment.completedAt) : 0);
  return assignments.filter((assignment) => assignment.status === "completed").sort((a, b) => completedTime(b) - completedTime(a));
}

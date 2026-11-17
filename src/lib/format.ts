const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-12-04T17:00" -> "Fri, Dec 4, 5:00 PM".
// Built by hand from the date parts so the result is the same on the server and in the browser,
// whatever the time zone or locale. Returns null if the text is not a valid date and time.
export function formatDeadline(deadline: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(deadline);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  // Rejects dates that don't exist, like month 13 or Feb 30, and hours or minutes out of range.
  if (date.getMonth() !== month - 1 || date.getDate() !== day || hour > 23 || minute > 59) return null;
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour < 12 ? "AM" : "PM";
  return `${WEEKDAYS_SHORT[date.getDay()]}, ${MONTHS[month - 1]} ${day}, ${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

// 30 -> "30 min"
export function formatMinutes(minutes: number): string {
  return `${minutes} min`;
}

// A plan total: 200 -> "3 h 20 min", 60 -> "1 h", 45 -> "45 min".
export function formatTotalMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

// When a note was saved, relative to now, in local calendar days:
// "saved today", "saved yesterday", "saved Monday" (2 to 6 days ago), otherwise "saved Nov 10".
export function formatSavedAt(savedAt: string, now: Date = new Date()): string {
  const saved = new Date(savedAt);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(saved)) / 86_400_000);
  if (days <= 0) return "saved today";
  if (days === 1) return "saved yesterday";
  if (days <= 6) return `saved ${WEEKDAYS[saved.getDay()]}`;
  return `saved ${MONTHS[saved.getMonth()]} ${saved.getDate()}`;
}

// "You have a thesis." -> "Done when you have a thesis."
// The first letter is lowercased unless the first word looks like an acronym ("APA 7th ...").
export function doneWhenSentence(criterion: string): string {
  const isAcronym = /^[A-Z]{2}/.test(criterion);
  const first = isAcronym ? criterion : criterion.charAt(0).toLowerCase() + criterion.slice(1);
  return `Done when ${first}`;
}

// 1122000 ms -> "18:42". Rounds up, so the display reaches 0:00 only when time is up.
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Adds a full stop if the text doesn't already end with one.
export function withFullStop(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

// "PSYC 3024 · Urban green spaces essay" (top bar in session mode).
export function assignmentContext(assignment: { course?: string; title: string }): string {
  return [assignment.course, assignment.title].filter(Boolean).join(" · ");
}

// "PSYC 3024 · Due Fri, Dec 4, 5:00 PM" (assignment cards).
export function assignmentMeta(assignment: { course?: string; deadline?: string }): string {
  const due = assignment.deadline ? formatDeadline(assignment.deadline) : null;
  return [assignment.course, due && `Due ${due}`].filter(Boolean).join(" · ");
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[month - 1]} ${day}, ${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

// 30 -> "30 min"
export function formatMinutes(minutes: number): string {
  return `${minutes} min`;
}

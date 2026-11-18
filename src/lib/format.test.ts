import { describe, expect, it } from "vitest";
import {
  capitalizeFirst,
  doneWhenSentence,
  formatCountdown,
  formatDeadline,
  formatMinutes,
  formatSavedAt,
  formatTotalMinutes,
  withFullStop,
} from "@/lib/format";

describe("formatDeadline", () => {
  it("formats the sample deadline", () => {
    expect(formatDeadline("2026-12-04T17:00")).toBe("Fri, Dec 4, 5:00 PM");
  });

  it("handles midnight, noon and minutes", () => {
    expect(formatDeadline("2026-12-04T00:05")).toBe("Fri, Dec 4, 12:05 AM");
    expect(formatDeadline("2026-12-04T12:30")).toBe("Fri, Dec 4, 12:30 PM");
  });

  it("shows a date with no time as the date alone", () => {
    expect(formatDeadline("2026-12-04")).toBe("Fri, Dec 4");
    expect(formatDeadline("2026-02-30")).toBeNull();
  });

  it("returns null for text that is not a real date and time", () => {
    expect(formatDeadline("soon")).toBeNull();
    expect(formatDeadline("2026-02-30T10:00")).toBeNull();
    expect(formatDeadline("2026-12-04T25:00")).toBeNull();
  });
});

describe("formatSavedAt", () => {
  // Tuesday, Nov 17, 2026, 3 PM local time.
  const now = new Date(2026, 10, 17, 15, 0);
  const at = (day: number, hour = 9) => new Date(2026, 10, day, hour, 0).toISOString();

  it("says today, yesterday, a weekday, or a date", () => {
    expect(formatSavedAt(at(17, 1), now)).toBe("saved today");
    expect(formatSavedAt(at(16, 23), now)).toBe("saved yesterday");
    expect(formatSavedAt(at(15), now)).toBe("saved Sunday");
    expect(formatSavedAt(at(11), now)).toBe("saved Wednesday");
    expect(formatSavedAt(at(10), now)).toBe("saved Nov 10");
  });

  it("treats a time in the future as today", () => {
    expect(formatSavedAt(at(18), now)).toBe("saved today");
  });
});

describe("other formatters", () => {
  it("formatMinutes and formatTotalMinutes", () => {
    expect(formatMinutes(30)).toBe("30 min");
    expect(formatTotalMinutes(200)).toBe("3 h 20 min");
    expect(formatTotalMinutes(60)).toBe("1 h");
    expect(formatTotalMinutes(45)).toBe("45 min");
  });

  it("doneWhenSentence uses the criterion as written, so proper nouns keep their capital", () => {
    expect(doneWhenSentence("you have a one-sentence thesis.")).toBe("Done when you have a one-sentence thesis.");
    expect(doneWhenSentence("Turnitin confirms your submission.")).toBe("Done when Turnitin confirms your submission.");
    expect(doneWhenSentence("APA 7th is used throughout.")).toBe("Done when APA 7th is used throughout.");
  });

  it("capitalizeFirst capitalizes only the first letter", () => {
    expect(capitalizeFirst("you have a thesis.")).toBe("You have a thesis.");
    expect(capitalizeFirst("Turnitin confirms it.")).toBe("Turnitin confirms it.");
    expect(capitalizeFirst("")).toBe("");
  });

  it("formatCountdown rounds up to whole seconds", () => {
    expect(formatCountdown(1_122_000)).toBe("18:42");
    expect(formatCountdown(1_121_001)).toBe("18:42");
    expect(formatCountdown(0)).toBe("0:00");
  });

  it("withFullStop adds a full stop only when missing", () => {
    expect(withFullStop("Submit by Friday")).toBe("Submit by Friday.");
    expect(withFullStop("Done.")).toBe("Done.");
  });
});

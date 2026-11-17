import { describe, expect, it } from "vitest";
import { formatDeadline, formatMinutes } from "@/lib/format";

describe("formatDeadline", () => {
  it("formats the sample deadline", () => {
    expect(formatDeadline("2026-12-04T17:00")).toBe("Fri, Dec 4, 5:00 PM");
  });

  it("handles midnight, noon and minutes", () => {
    expect(formatDeadline("2026-12-04T00:05")).toBe("Fri, Dec 4, 12:05 AM");
    expect(formatDeadline("2026-12-04T12:30")).toBe("Fri, Dec 4, 12:30 PM");
  });

  it("returns null for text that is not a real date and time", () => {
    expect(formatDeadline("soon")).toBeNull();
    expect(formatDeadline("2026-02-30T10:00")).toBeNull();
    expect(formatDeadline("2026-12-04T25:00")).toBeNull();
  });
});

describe("formatMinutes", () => {
  it("adds the unit", () => {
    expect(formatMinutes(30)).toBe("30 min");
  });
});

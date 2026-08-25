import { describe, expect, it } from "vitest";
import { ideathonCountdownFor } from "@/lib/ideathonCountdown";
import type { CalendarEvent } from "@/content/calendar";

function event(overrides: Partial<CalendarEvent> & Pick<CalendarEvent, "startDate">): CalendarEvent {
  return {
    id: "0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c",
    title: "Ideathon",
    titleEn: null,
    category: "innolab",
    endDate: null,
    startTime: null,
    endTime: null,
    location: null,
    description: null,
    descriptionEn: null,
    tentative: false,
    internalLink: "/ideathon",
    ...overrides,
  };
}

describe("ideathonCountdownFor", () => {
  it("returns a whole-days resolution when no start time is known", () => {
    // 2026-09-05T10:00Z, well clear of any midnight boundary in Berlin.
    const now = new Date("2026-09-05T10:00:00Z").getTime();
    const result = ideathonCountdownFor(event({ startDate: "2026-09-24" }), now);
    expect(result).toEqual({ resolution: "days", days: 19 });
  });

  it("returns an exact days/hours/minutes/seconds resolution once a start time is set", () => {
    const now = new Date("2026-09-24T15:59:30Z").getTime();
    const result = ideathonCountdownFor(event({ startDate: "2026-09-24", startTime: "18:00" }), now);
    // Target is 16:00:00 UTC (18:00 CEST) — 30 seconds away.
    expect(result).toEqual({ resolution: "exact", days: 0, hours: 0, minutes: 0, seconds: 30 });
  });

  it("switches from days to exact resolution for the same event once start time is filled in", () => {
    const now = new Date("2026-09-05T10:00:00Z").getTime();
    const withoutTime = ideathonCountdownFor(event({ startDate: "2026-09-24" }), now);
    const withTime = ideathonCountdownFor(event({ startDate: "2026-09-24", startTime: "18:00" }), now);
    expect(withoutTime?.resolution).toBe("days");
    expect(withTime?.resolution).toBe("exact");
  });

  it("returns null once the target instant has passed", () => {
    const now = new Date("2026-09-25T00:00:00Z").getTime();
    expect(ideathonCountdownFor(event({ startDate: "2026-09-24", startTime: "18:00" }), now)).toBeNull();
  });
});

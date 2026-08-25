import { describe, expect, it } from "vitest";
import { findNextIdeathonEvent, ideathonStartInstant, isIdeathonEvent } from "@/lib/ideathonEvent";
import type { CalendarEvent } from "@/content/calendar";

// Midday in Berlin (CEST, +02:00) — well clear of any midnight boundary.
const NOW = new Date("2026-09-05T10:00:00Z").getTime();

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

describe("isIdeathonEvent", () => {
  it("matches a row whose internal_link points at /ideathon", () => {
    expect(isIdeathonEvent(event({ startDate: "2026-09-24" }))).toBe(true);
  });

  it("does not match an unrelated or unlinked row", () => {
    expect(isIdeathonEvent(event({ startDate: "2026-09-24", internalLink: null }))).toBe(false);
    expect(isIdeathonEvent(event({ startDate: "2026-09-24", internalLink: "/events" }))).toBe(false);
  });
});

describe("ideathonStartInstant", () => {
  it("uses the given start time in the site timezone", () => {
    const instant = ideathonStartInstant(event({ startDate: "2026-09-24", startTime: "18:00" }));
    // 2026-09-24 is CEST (+02:00), so 18:00 local is 16:00 UTC.
    expect(instant.toISOString()).toBe("2026-09-24T16:00:00.000Z");
  });

  it("falls back to midnight site time when no start time is set", () => {
    const instant = ideathonStartInstant(event({ startDate: "2026-09-24" }));
    expect(instant.toISOString()).toBe("2026-09-23T22:00:00.000Z");
  });
});

describe("findNextIdeathonEvent", () => {
  it("returns the soonest upcoming row linked to /ideathon", () => {
    const later = event({ startDate: "2027-09-24" });
    const sooner = event({ startDate: "2026-09-24" });
    expect(findNextIdeathonEvent([later, sooner], NOW)).toBe(sooner);
  });

  it("ignores rows not linked to /ideathon", () => {
    const other = event({ startDate: "2026-09-06", internalLink: "/events" });
    expect(findNextIdeathonEvent([other], NOW)).toBeNull();
  });

  it("ignores a linked row that has already started", () => {
    const started = event({ startDate: "2026-09-01" });
    expect(findNextIdeathonEvent([started], NOW)).toBeNull();
  });

  it("returns null when nothing is upcoming", () => {
    expect(findNextIdeathonEvent([], NOW)).toBeNull();
  });
});

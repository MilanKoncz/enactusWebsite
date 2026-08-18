import { describe, expect, it } from "vitest";
import {
  formatDayLong,
  formatEventDate,
  formatEventTime,
  formatMonthHeading,
  parseDateOnly,
} from "@/lib/calendarFormat";
import type { CalendarEvent } from "@/content/calendar";

function event(overrides: Partial<CalendarEvent> & Pick<CalendarEvent, "startDate">): CalendarEvent {
  return {
    id: "00000000-0000-0000-0000-000000000001",
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
    ...overrides,
  };
}

describe("calendarFormat", () => {
  it("parses a plain date-only string as a UTC calendar date", () => {
    expect(parseDateOnly("2026-09-17").getTime()).toBe(Date.UTC(2026, 8, 17));
  });

  it("formats a single-day event as one date", () => {
    expect(formatEventDate(event({ startDate: "2026-09-17" }), "de")).toBe("17. September 2026");
  });

  it("formats a multi-day event as a range of two full dates", () => {
    expect(formatEventDate(event({ startDate: "2026-09-17", endDate: "2026-09-20" }), "de")).toBe(
      "17. September 2026 – 20. September 2026",
    );
  });

  it("treats an end date equal to the start date as a single day, not a range", () => {
    expect(formatEventDate(event({ startDate: "2026-09-17", endDate: "2026-09-17" }), "de")).toBe(
      "17. September 2026",
    );
  });

  it("formats a month heading from a YYYY-MM key", () => {
    expect(formatMonthHeading("2026-09", "de")).toBe("September 2026");
  });

  it("spells out a single day on its own, independent of any event", () => {
    expect(formatDayLong("2026-09-17", "de")).toBe("17. September 2026");
  });

  it("returns null for an event with no start time", () => {
    expect(formatEventTime(event({ startDate: "2026-09-17" }))).toBeNull();
  });

  it("formats a start time alone", () => {
    expect(formatEventTime(event({ startDate: "2026-09-17", startTime: "18:00" }))).toBe("18:00");
  });

  it("formats a start and end time as a range", () => {
    expect(
      formatEventTime(event({ startDate: "2026-09-17", startTime: "14:00", endTime: "16:00" })),
    ).toBe("14:00–16:00");
  });
});

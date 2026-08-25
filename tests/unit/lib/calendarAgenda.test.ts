import { describe, expect, it } from "vitest";
import {
  countdownFor,
  currentMonthKey,
  filterByCategories,
  groupByMonth,
  isPastEvent,
  nextUpcomingEvent,
  splitMonthGroups,
  visibleCategories,
} from "@/lib/calendarAgenda";
import type { CalendarEvent } from "@/content/calendar";

// Midday in Berlin (CEST, +02:00), well clear of any midnight boundary —
// the calendar date this resolves to in SITE_TIMEZONE is unambiguously
// 2026-09-05.
const NOW = new Date("2026-09-05T10:00:00Z").getTime();

function event(overrides: Partial<CalendarEvent> & Pick<CalendarEvent, "startDate">): CalendarEvent {
  return {
    id: "0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c",
    title: "Test event",
    titleEn: null,
    category: "socials",
    endDate: null,
    startTime: null,
    endTime: null,
    location: null,
    description: null,
    descriptionEn: null,
    tentative: false,
    internalLink: null,
    ...overrides,
  };
}

describe("calendarAgenda", () => {
  describe("countdownFor", () => {
    it("reads as today when the event starts today", () => {
      expect(countdownFor(event({ startDate: "2026-09-05" }), NOW)).toEqual({ state: "today" });
    });

    it("reads as today for an ongoing multi-day event, even though it didn't start today", () => {
      const ongoing = event({ startDate: "2026-09-04", endDate: "2026-09-06" });
      expect(countdownFor(ongoing, NOW)).toEqual({ state: "today" });
    });

    it("reads as tomorrow when the event starts the next calendar day", () => {
      expect(countdownFor(event({ startDate: "2026-09-06" }), NOW)).toEqual({ state: "tomorrow" });
    });

    it("counts whole days for anything further out", () => {
      expect(countdownFor(event({ startDate: "2026-09-17" }), NOW)).toEqual({ state: "future", days: 12 });
    });

    it("counts correctly across a month boundary", () => {
      expect(countdownFor(event({ startDate: "2026-10-02" }), NOW)).toEqual({ state: "future", days: 27 });
    });
  });

  describe("isPastEvent", () => {
    it("is true once the event's last day is before today", () => {
      expect(isPastEvent(event({ startDate: "2026-09-04" }), NOW)).toBe(true);
    });

    it("is false for an event that ends today", () => {
      expect(isPastEvent(event({ startDate: "2026-09-01", endDate: "2026-09-05" }), NOW)).toBe(false);
    });

    it("is false for an event starting today or later", () => {
      expect(isPastEvent(event({ startDate: "2026-09-05" }), NOW)).toBe(false);
      expect(isPastEvent(event({ startDate: "2026-09-06" }), NOW)).toBe(false);
    });
  });

  describe("nextUpcomingEvent", () => {
    it("picks the soonest event that hasn't fully ended", () => {
      const events = [
        event({ startDate: "2026-09-20", title: "Later" }),
        event({ startDate: "2026-09-10", title: "Sooner" }),
        event({ startDate: "2026-09-01", title: "Already over" }),
      ];
      expect(nextUpcomingEvent(events, NOW)?.title).toBe("Sooner");
    });

    it("prefers an ongoing multi-day event over a later one that hasn't started", () => {
      const events = [
        event({ startDate: "2026-09-04", endDate: "2026-09-08", title: "Ongoing" }),
        event({ startDate: "2026-09-10", title: "Later" }),
      ];
      expect(nextUpcomingEvent(events, NOW)?.title).toBe("Ongoing");
    });

    it("returns null once every event is in the past", () => {
      const events = [event({ startDate: "2026-09-01" }), event({ startDate: "2026-09-02" })];
      expect(nextUpcomingEvent(events, NOW)).toBeNull();
    });

    it("returns null for an empty list", () => {
      expect(nextUpcomingEvent([], NOW)).toBeNull();
    });
  });

  describe("currentMonthKey", () => {
    it("resolves the running month in SITE_TIMEZONE", () => {
      expect(currentMonthKey(NOW)).toBe("2026-09");
    });
  });

  describe("splitMonthGroups", () => {
    it("collapses whole months strictly before the current one, keeping the rest", () => {
      const groups = groupByMonth([
        event({ startDate: "2026-08-01", title: "August" }),
        event({ startDate: "2026-09-01", title: "September" }),
        event({ startDate: "2026-10-01", title: "October" }),
      ]);
      const { earlierMonths, currentAndLaterMonths } = splitMonthGroups(groups, NOW);
      expect(earlierMonths.map((g) => g.monthKey)).toEqual(["2026-08"]);
      expect(currentAndLaterMonths.map((g) => g.monthKey)).toEqual(["2026-09", "2026-10"]);
    });

    it("keeps an already-past event visible when it shares the current month", () => {
      // today is 2026-09-05 — an event on the 1st is individually past
      // (isPastEvent) but must not be swept into "earlierMonths", since
      // that collapse operates on whole months, not individual dates.
      const groups = groupByMonth([event({ startDate: "2026-09-01", title: "Early this month" })]);
      const { earlierMonths, currentAndLaterMonths } = splitMonthGroups(groups, NOW);
      expect(earlierMonths).toHaveLength(0);
      expect(currentAndLaterMonths[0].events.map((e) => e.title)).toEqual(["Early this month"]);
      expect(isPastEvent(groups[0].events[0], NOW)).toBe(true);
    });
  });

  describe("groupByMonth", () => {
    it("groups by calendar month and orders groups and events chronologically", () => {
      const events = [
        event({ startDate: "2026-10-02", title: "October" }),
        event({ startDate: "2026-09-20", title: "September late" }),
        event({ startDate: "2026-09-01", title: "September early" }),
      ];
      const groups = groupByMonth(events);
      expect(groups.map((g) => g.monthKey)).toEqual(["2026-09", "2026-10"]);
      expect(groups[0].events.map((e) => e.title)).toEqual(["September early", "September late"]);
    });

    it("orders same-day events by start time", () => {
      const events = [
        event({ startDate: "2026-09-05", startTime: "18:00", title: "Evening" }),
        event({ startDate: "2026-09-05", startTime: "09:00", title: "Morning" }),
      ];
      expect(groupByMonth(events)[0].events.map((e) => e.title)).toEqual(["Morning", "Evening"]);
    });
  });

  describe("visibleCategories", () => {
    it("returns only categories with at least one event, in the fixed documented order", () => {
      const events = [
        event({ startDate: "2026-09-01", category: "bewerbung" }),
        event({ startDate: "2026-09-02", category: "innolab" }),
      ];
      expect(visibleCategories(events)).toEqual(["innolab", "bewerbung"]);
    });

    it("returns an empty list when there are no events", () => {
      expect(visibleCategories([])).toEqual([]);
    });
  });

  describe("filterByCategories", () => {
    const events = [
      event({ startDate: "2026-09-01", category: "bewerbung", title: "A" }),
      event({ startDate: "2026-09-02", category: "socials", title: "B" }),
    ];

    it("returns every event when no category is selected", () => {
      expect(filterByCategories(events, [])).toHaveLength(2);
    });

    it("narrows to the selected categories only", () => {
      expect(filterByCategories(events, ["socials"]).map((e) => e.title)).toEqual(["B"]);
    });
  });
});

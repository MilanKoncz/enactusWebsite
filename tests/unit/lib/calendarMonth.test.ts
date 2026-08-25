import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  eventsOnDay,
  firstMonthWithEvents,
  monthKeyOf,
  monthWeeks,
  weekBars,
} from "@/lib/calendarMonth";
import type { CalendarEvent } from "@/content/calendar";

let nextId = 0;
function event(overrides: Partial<CalendarEvent> & Pick<CalendarEvent, "startDate">): CalendarEvent {
  nextId += 1;
  return {
    id: `00000000-0000-0000-0000-${String(nextId).padStart(12, "0")}`,
    title: `Event ${nextId}`,
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

describe("monthKeyOf / addMonths / addDays", () => {
  it("takes the YYYY-MM prefix of a date", () => {
    expect(monthKeyOf("2026-09-17")).toBe("2026-09");
  });

  it("carries a month addition across a year boundary, forward and back", () => {
    expect(addMonths("2026-11", 2)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("carries a day addition across a month and year boundary", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("monthWeeks", () => {
  it("always returns 6 rows of 7 contiguous days", () => {
    const weeks = monthWeeks("2026-09");
    expect(weeks).toHaveLength(6);
    const flat = weeks.flat();
    expect(flat).toHaveLength(42);
    for (let i = 1; i < flat.length; i++) {
      expect(addDays(flat[i - 1], 1)).toBe(flat[i]);
    }
  });

  it("starts every row on a Monday", () => {
    for (const key of ["2026-09", "2026-02", "2027-01"]) {
      for (const week of monthWeeks(key)) {
        const [year, month, day] = week[0].split("-").map(Number);
        expect(new Date(Date.UTC(year, month - 1, day)).getUTCDay()).toBe(1);
      }
    }
  });

  it("includes the 1st of the requested month somewhere in the grid", () => {
    for (const key of ["2026-09", "2026-02", "2027-01"]) {
      expect(monthWeeks(key).flat()).toContain(`${key}-01`);
    }
  });

  it("starts the grid on the month's own 1st when that day is already a Monday", () => {
    // Found independently of monthWeeks itself, so this isn't circular.
    let key = "2026-01";
    for (let i = 0; i < 24; i++) {
      const [year, month] = key.split("-").map(Number);
      if (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() === 1) break;
      key = addMonths(key, 1);
    }
    expect(monthWeeks(key)[0][0]).toBe(`${key}-01`);
  });
});

describe("eventsOnDay", () => {
  it("includes a single-day event only on its own date", () => {
    const e = event({ startDate: "2026-09-17" });
    expect(eventsOnDay([e], "2026-09-17")).toEqual([e]);
    expect(eventsOnDay([e], "2026-09-18")).toEqual([]);
  });

  it("includes a multi-day event on every date it spans, inclusive", () => {
    const e = event({ startDate: "2026-09-17", endDate: "2026-09-19" });
    expect(eventsOnDay([e], "2026-09-16")).toEqual([]);
    expect(eventsOnDay([e], "2026-09-17")).toEqual([e]);
    expect(eventsOnDay([e], "2026-09-18")).toEqual([e]);
    expect(eventsOnDay([e], "2026-09-19")).toEqual([e]);
    expect(eventsOnDay([e], "2026-09-20")).toEqual([]);
  });
});

describe("firstMonthWithEvents", () => {
  it("returns null for an empty calendar", () => {
    expect(firstMonthWithEvents([], "2026-09")).toBeNull();
  });

  it("returns the requested month itself when it already has an event", () => {
    const events = [event({ startDate: "2026-09-05" })];
    expect(firstMonthWithEvents(events, "2026-09")).toBe("2026-09");
  });

  it("jumps forward to the next month that actually has an event", () => {
    const events = [event({ startDate: "2026-11-03" })];
    expect(firstMonthWithEvents(events, "2026-09")).toBe("2026-11");
  });

  it("returns null when every event lies entirely before the requested month", () => {
    const events = [event({ startDate: "2026-01-01", endDate: "2026-01-05" })];
    expect(firstMonthWithEvents(events, "2026-09")).toBeNull();
  });

  it("counts a multi-day event that only started in an earlier month but is still ongoing", () => {
    const events = [event({ startDate: "2026-08-28", endDate: "2026-09-02" })];
    expect(firstMonthWithEvents(events, "2026-09")).toBe("2026-09");
  });
});

describe("weekBars", () => {
  // Monday-first week covering 2026-09-14 (Mon) .. 2026-09-20 (Sun).
  const week = ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18", "2026-09-19", "2026-09-20"];

  it("places a single-day event at its own column, lane 0", () => {
    const e = event({ startDate: "2026-09-16" });
    const { bars, overflowByDate } = weekBars([e], week, 3);
    expect(bars).toEqual([
      { event: e, column: 2, span: 1, lane: 0, continuesBefore: false, continuesAfter: false },
    ]);
    expect(overflowByDate).toEqual({});
  });

  it("spans a multi-day event across its full column range, clipped to the week", () => {
    // Starts the Friday before this week, ends the Tuesday after — clipped
    // to the full Monday..Sunday width, continuing on both sides.
    const e = event({ startDate: "2026-09-11", endDate: "2026-09-22" });
    const { bars } = weekBars([e], week, 3);
    expect(bars).toEqual([
      { event: e, column: 0, span: 7, lane: 0, continuesBefore: true, continuesAfter: true },
    ]);
  });

  it("packs two events on different days into the same lane, since they never share a column", () => {
    const a = event({ startDate: "2026-09-14" });
    const b = event({ startDate: "2026-09-18" });
    const { bars } = weekBars([a, b], week, 3);
    expect(bars.map((bar) => bar.lane)).toEqual([0, 0]);
  });

  it("gives overlapping events on the same day separate lanes", () => {
    const a = event({ startDate: "2026-09-16" });
    const b = event({ startDate: "2026-09-16" });
    const { bars } = weekBars([a, b], week, 3);
    expect(bars.map((bar) => bar.lane).sort()).toEqual([0, 1]);
  });

  it("overflows the 4th simultaneous event on one day, past a 3-lane cap", () => {
    const events = [
      event({ startDate: "2026-09-16" }),
      event({ startDate: "2026-09-16" }),
      event({ startDate: "2026-09-16" }),
      event({ startDate: "2026-09-16" }),
    ];
    const { bars, overflowByDate } = weekBars(events, week, 3);
    expect(bars).toHaveLength(3);
    expect(overflowByDate).toEqual({ "2026-09-16": 1 });
  });

  it("reports one overflow count per day a hidden multi-day event touches", () => {
    const events = [
      event({ startDate: "2026-09-15" }),
      event({ startDate: "2026-09-15" }),
      event({ startDate: "2026-09-15" }),
      // Longer, so it sorts first and would normally win a lane — but here
      // every lane is already full by the time overflow is reported for a
      // shorter, later-sorted event instead; this event itself is the one
      // occupying a lane across both days.
      event({ startDate: "2026-09-15", endDate: "2026-09-16" }),
      event({ startDate: "2026-09-16" }),
    ];
    const { overflowByDate } = weekBars(events, week, 3);
    // Three single-day events plus the multi-day one all fall on the 15th;
    // one of the four loses out on that day. The 16th only has the
    // continuing multi-day bar plus one single-day event — both fit.
    expect(overflowByDate["2026-09-15"]).toBe(1);
    expect(overflowByDate["2026-09-16"]).toBeUndefined();
  });

  it("keeps a continuing event on its preferred lane when that lane is still free", () => {
    const e = event({ startDate: "2026-09-11", endDate: "2026-09-22" });
    const fresh = event({ startDate: "2026-09-14" });
    // Without a preference, the continuing event (sorted first by start
    // date) would take lane 0 — force it to have used lane 1 last week,
    // and confirm it's honored here even though lane 0 is free.
    const { bars } = weekBars([fresh, e], week, 3, { [e.id]: 1 });
    const continuing = bars.find((bar) => bar.event.id === e.id)!;
    expect(continuing.lane).toBe(1);
  });

  it("falls back to the lowest free lane when the preferred one is already taken", () => {
    const e = event({ startDate: "2026-09-11", endDate: "2026-09-22" });
    const blocker = event({ startDate: "2026-09-14" });
    const { bars } = weekBars([e, blocker], week, 3, { [e.id]: 0, [blocker.id]: 0 });
    // blocker sorts after e (later start date) but both prefer lane 0 —
    // e claims it first, blocker must fall back.
    const eBar = bars.find((bar) => bar.event.id === e.id)!;
    const blockerBar = bars.find((bar) => bar.event.id === blocker.id)!;
    expect(eBar.lane).toBe(0);
    expect(blockerBar.lane).not.toBe(0);
  });
});

import type { CalendarEvent } from "@/content/calendar";

/**
 * Pure geometry for the homepage calendar's month grid — dates, month
 * navigation, and the lane-packing that turns a list of events into the
 * bars a week row actually draws. Kept separate from the component the
 * same way lib/calendarAgenda.ts is: testable without a DOM, a timer, or a
 * database, and reusable by both the grid's month view and its "jump to
 * the next month with events" fallback.
 *
 * All date arithmetic runs on plain "YYYY-MM-DD" strings through
 * `Date.UTC`, never the machine's local timezone or a wall-clock `Date` —
 * the same reasoning calendarAgenda.ts's own comment gives: these are
 * calendar days with no time-of-day component, not real-world instants,
 * so there is no DST to be confused about.
 */

export type MonthKey = string; // "YYYY-MM"

const MS_PER_DAY = 86_400_000;

function toUtcMs(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function fromUtcMs(ms: number): string {
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: string, delta: number): string {
  return fromUtcMs(toUtcMs(date) + delta * MS_PER_DAY);
}

export function monthKeyOf(date: string): MonthKey {
  return date.slice(0, 7);
}

export function addMonths(key: MonthKey, delta: number): MonthKey {
  const [year, month] = key.split("-").map(Number);
  const total = year * 12 + (month - 1) + delta;
  const resultYear = Math.floor(total / 12);
  const resultMonth = total - resultYear * 12 + 1;
  return `${resultYear}-${String(resultMonth).padStart(2, "0")}`;
}

function firstDayOfMonth(key: MonthKey): string {
  return `${key}-01`;
}

function lastDayOfMonth(key: MonthKey): string {
  return addDays(firstDayOfMonth(addMonths(key, 1)), -1);
}

// Monday=1 .. Sunday=7 — Date.getUTCDay()'s own Sunday=0 shifted so "leading
// days before the 1st" comes out to 0 when the month starts on a Monday.
function isoWeekday(date: string): number {
  const day = new Date(toUtcMs(date)).getUTCDay();
  return day === 0 ? 7 : day;
}

/**
 * Always 6 rows of 7 ISO date strings, Monday first — a fixed grid height
 * regardless of how many calendar weeks the month itself needs (4, 5, or
 * 6), so switching months never resizes the page around it. The extra rows
 * a shorter month doesn't need spill into the following month, exactly
 * like the leading days spill into the previous one.
 */
export function monthWeeks(key: MonthKey): string[][] {
  const leadingDays = isoWeekday(firstDayOfMonth(key)) - 1;
  const gridStart = addDays(firstDayOfMonth(key), -leadingDays);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day)),
  );
}

function lastDayOf(event: CalendarEvent): string {
  return event.endDate ?? event.startDate;
}

function eventDurationDays(event: CalendarEvent): number {
  return Math.round((toUtcMs(lastDayOf(event)) - toUtcMs(event.startDate)) / MS_PER_DAY) + 1;
}

function eventOverlapsMonth(event: CalendarEvent, key: MonthKey): boolean {
  return event.startDate <= lastDayOfMonth(key) && lastDayOf(event) >= firstDayOfMonth(key);
}

export function eventsOnDay(events: CalendarEvent[], date: string): CalendarEvent[] {
  return events.filter((event) => event.startDate <= date && date <= lastDayOf(event));
}

/**
 * The soonest month at or after `from` that has at least one event
 * overlapping it — an event that merely started in an earlier month but
 * is still ongoing counts. Null once nothing at or after `from` has an
 * event at all; the caller renders its own empty state rather than this
 * function inventing one.
 */
export function firstMonthWithEvents(events: CalendarEvent[], from: MonthKey): MonthKey | null {
  if (events.length === 0) return null;
  // Bounds the search so an empty stretch of future months can't loop
  // forever: no event reaches past the latest month any of them ends in.
  const furthest = events.reduce((max, event) => {
    const key = monthKeyOf(lastDayOf(event));
    return key > max ? key : max;
  }, from);

  let cursor = from;
  while (cursor <= furthest) {
    if (events.some((event) => eventOverlapsMonth(event, cursor))) return cursor;
    cursor = addMonths(cursor, 1);
  }
  return null;
}

export type WeekBar = {
  event: CalendarEvent;
  /** 0-based column within the week (0 = Monday), clipped to this week. */
  column: number;
  /** Number of columns this segment spans, clipped to this week. */
  span: number;
  /** 0-based lane, always below `maxLanes`. */
  lane: number;
  /** The event was already under way before this week started. */
  continuesBefore: boolean;
  /** The event is still ongoing after this week ends. */
  continuesAfter: boolean;
};

export type WeekLayout = {
  bars: WeekBar[];
  /** Per-date count of events that didn't fit in `maxLanes` this week — the
   * cell's own "+N" indicator reads straight from this. */
  overflowByDate: Record<string, number>;
};

/**
 * Lane-packs the events touching one week (7 consecutive ISO dates, Monday
 * first) into at most `maxLanes` horizontal rows — the same greedy
 * interval-scheduling shape a day-planner UI uses. Events are considered in
 * start-date order, longer ones first on a tie, and a lane only ever takes
 * an event if it's free across *every* day the event spans this week: a bar
 * is never split mid-week onto two different lanes. Whatever doesn't fit
 * within `maxLanes` is reported through `overflowByDate` instead, one count
 * per day it touches, not silently dropped.
 *
 * `preferredLanes` (event id -> lane) lets a multi-week event keep the same
 * lane it had last week when that lane is still free here, so it doesn't
 * jump height at the row break for no reason — the caller threads this
 * through week by week, top to bottom.
 */
export function weekBars(
  events: CalendarEvent[],
  weekDates: string[],
  maxLanes: number,
  preferredLanes: Record<string, number> = {},
): WeekLayout {
  const weekStart = weekDates[0];
  const weekEnd = weekDates[weekDates.length - 1];

  const touching = events
    .filter((event) => event.startDate <= weekEnd && lastDayOf(event) >= weekStart)
    .map((event) => {
      const clippedStart = event.startDate > weekStart ? event.startDate : weekStart;
      const clippedEnd = lastDayOf(event) < weekEnd ? lastDayOf(event) : weekEnd;
      const column = weekDates.indexOf(clippedStart);
      const span = weekDates.indexOf(clippedEnd) - column + 1;
      return {
        event,
        column,
        span,
        duration: eventDurationDays(event),
        continuesBefore: event.startDate < weekStart,
        continuesAfter: lastDayOf(event) > weekEnd,
      };
    })
    .sort((a, b) => {
      if (a.event.startDate !== b.event.startDate) return a.event.startDate < b.event.startDate ? -1 : 1;
      return b.duration - a.duration;
    });

  const lanes: Set<number>[] = Array.from({ length: maxLanes }, () => new Set());
  const bars: WeekBar[] = [];
  const overflowByDate: Record<string, number> = {};

  for (const item of touching) {
    const columns = Array.from({ length: item.span }, (_, i) => item.column + i);
    const preferred = preferredLanes[item.event.id];
    const candidateLanes =
      preferred !== undefined && preferred < maxLanes
        ? [preferred, ...lanes.keys()].filter((lane, index, all) => all.indexOf(lane) === index)
        : [...lanes.keys()];

    const freeLane = candidateLanes.find((lane) => columns.every((column) => !lanes[lane].has(column)));

    if (freeLane === undefined) {
      for (const column of columns) {
        const date = weekDates[column];
        overflowByDate[date] = (overflowByDate[date] ?? 0) + 1;
      }
      continue;
    }

    for (const column of columns) lanes[freeLane].add(column);
    bars.push({
      event: item.event,
      column: item.column,
      span: item.span,
      lane: freeLane,
      continuesBefore: item.continuesBefore,
      continuesAfter: item.continuesAfter,
    });
  }

  return { bars, overflowByDate };
}

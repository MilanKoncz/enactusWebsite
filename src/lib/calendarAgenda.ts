import { SITE_TIMEZONE } from "@/content/timezone";
import type { CalendarCategory, CalendarEvent } from "@/content/calendar";
import { CALENDAR_CATEGORIES } from "@/content/calendar";

/**
 * Pure functions of "now" (as epoch ms) and an explicit event list, kept
 * separate from the ticking clock (useNow.ts) and from where the events
 * come from (lib/calendarEvents.ts) — same split lib/recruitingStatus.ts
 * uses, for the same reason: testable without mocking timers, a database,
 * or a cache.
 *
 * "Today" is always resolved in SITE_TIMEZONE, never in UTC or the
 * machine's local zone: calendar_events stores plain dates with no
 * timezone (migrations/0006_calendar_events.sql), so the one place a
 * timezone can enter at all is deciding what "today" means from a raw
 * epoch timestamp — get that wrong and the agenda reshuffles for an hour
 * or two around every midnight, worst right around the deadlines board
 * members actually care about (a 00:00 application deadline).
 */

// Exported for the month grid (components/sections/EventCalendarGrid.tsx),
// which needs "today" as its own plain date string — for the grid's "today"
// marker and its default selected day — not just the derived month key
// currentMonthKey already gives below.
export function todayInSiteTimezone(nowMs: number): string {
  // en-CA formats as YYYY-MM-DD directly — the same trick
  // lib/recruitingTime.ts's instantToWallClock uses, without needing the
  // time-of-day parts this only needs a date from.
  return new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIMEZONE }).format(new Date(nowMs));
}

// Both inputs are plain YYYY-MM-DD strings with no time component, so a
// UTC-anchored Date.UTC diff gives an exact whole-day count regardless of
// which real-world DST offset either day happens to fall under — there is
// no "wall clock" here to be confused about, only calendar days.
// Exported for lib/ideathonCountdown.ts, which needs the identical
// whole-calendar-day math for its days-only display resolution — not a
// second copy of the same UTC-anchored diff.
export function daysBetween(fromDate: string, toDate: string): number {
  const [fy, fm, fd] = fromDate.split("-").map(Number);
  const [ty, tm, td] = toDate.split("-").map(Number);
  const fromMs = Date.UTC(fy, fm - 1, fd);
  const toMs = Date.UTC(ty, tm - 1, td);
  return Math.round((toMs - fromMs) / 86_400_000);
}

function lastDayOf(event: CalendarEvent): string {
  return event.endDate ?? event.startDate;
}

export function isPastEvent(event: CalendarEvent, nowMs: number): boolean {
  return lastDayOf(event) < todayInSiteTimezone(nowMs);
}

export type EventCountdown =
  | { state: "today" }
  | { state: "tomorrow" }
  | { state: "future"; days: number };

/**
 * Days until an event, from the site's own "today". An event already under
 * way (today falls between its start and end date, inclusive) reads as
 * "today" — a countdown has nothing left to count down for a multi-day
 * event that's already started.
 */
export function countdownFor(event: CalendarEvent, nowMs: number): EventCountdown {
  const today = todayInSiteTimezone(nowMs);
  const end = lastDayOf(event);
  if (event.startDate <= today && today <= end) return { state: "today" };

  const days = daysBetween(today, event.startDate);
  if (days <= 0) return { state: "today" };
  if (days === 1) return { state: "tomorrow" };
  return { state: "future", days };
}

function compareByStart(a: CalendarEvent, b: CalendarEvent): number {
  if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1;
  const aTime = a.startTime ?? "00:00";
  const bTime = b.startTime ?? "00:00";
  return aTime < bTime ? -1 : aTime > bTime ? 1 : 0;
}

/**
 * The highlighted card above the list: the soonest event that hasn't fully
 * ended yet, an ongoing multi-day event included. Null once nothing is
 * upcoming — the caller renders the empty state, it never invents one.
 */
export function nextUpcomingEvent(events: CalendarEvent[], nowMs: number): CalendarEvent | null {
  const upcoming = events.filter((event) => !isPastEvent(event, nowMs)).sort(compareByStart);
  return upcoming[0] ?? null;
}

export type MonthGroup = { monthKey: string; events: CalendarEvent[] };

/** monthKey is "YYYY-MM" — display formatting is the component's job, this
 * only groups and orders. */
export function groupByMonth(events: CalendarEvent[]): MonthGroup[] {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of [...events].sort(compareByStart)) {
    const monthKey = event.startDate.slice(0, 7);
    const group = groups.get(monthKey);
    if (group) group.push(event);
    else groups.set(monthKey, [event]);
  }
  return Array.from(groups, ([monthKey, monthEvents]) => ({ monthKey, events: monthEvents }));
}

export function currentMonthKey(nowMs: number): string {
  return todayInSiteTimezone(nowMs).slice(0, 7);
}

/**
 * Splits month groups at "the running month" — not at today's exact date.
 * An event on the 3rd of a month that started on the 5th is still shown by
 * default (it's part of the current month's own view, per
 * docs/content-guide.md's Termine section), only dimmed individually via
 * isPastEvent; a whole month strictly before the current one is what
 * collapses behind "Frühere Termine".
 */
export function splitMonthGroups(
  groups: MonthGroup[],
  nowMs: number,
): { earlierMonths: MonthGroup[]; currentAndLaterMonths: MonthGroup[] } {
  const current = currentMonthKey(nowMs);
  return {
    earlierMonths: groups.filter((group) => group.monthKey < current),
    currentAndLaterMonths: groups.filter((group) => group.monthKey >= current),
  };
}

/** Categories with at least one event, in the fixed documented order — a
 * category nobody has scheduled gets no filter chip, so there's no dead
 * control to tab past. */
export function visibleCategories(events: CalendarEvent[]): CalendarCategory[] {
  const present = new Set(events.map((event) => event.category));
  return CALENDAR_CATEGORIES.filter((category) => present.has(category));
}

/** No category selected means everything is visible — an active filter only
 * narrows, it never has to be "all" explicitly. */
export function filterByCategories(
  events: CalendarEvent[],
  selected: CalendarCategory[],
): CalendarEvent[] {
  if (selected.length === 0) return events;
  return events.filter((event) => selected.includes(event.category));
}

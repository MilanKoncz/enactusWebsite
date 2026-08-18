import type { CalendarEvent } from "@/content/calendar";

/**
 * Pure date/time formatting shared by every calendar view (the agenda list
 * and the month grid) — extracted from EventCalendar.tsx once a second view
 * needed the exact same formatting rather than a copy of it.
 */

// Parses a plain "YYYY-MM-DD" as a UTC calendar date and always formats it
// back with an explicit UTC timeZone — the round trip is then independent
// of whichever timezone the server or the visitor's browser happens to run
// in, so the server-rendered and first client-rendered text can never
// disagree (the calendar_events columns have no time-of-day component to
// begin with, see migrations/0006_calendar_events.sql).
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatEventDate(event: CalendarEvent, locale: string): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const start = formatter.format(parseDateOnly(event.startDate));
  if (!event.endDate || event.endDate === event.startDate) return start;
  return `${start} – ${formatter.format(parseDateOnly(event.endDate))}`;
}

export function formatMonthHeading(monthKey: string, locale: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

export function formatEventTime(event: CalendarEvent): string | null {
  if (!event.startTime) return null;
  return event.endTime ? `${event.startTime}–${event.endTime}` : event.startTime;
}

/** A single day, spelled out ("17. September 2026") — the month grid's day
 * heading needs this on its own, without an event to hang it off of, unlike
 * formatEventDate above. */
export function formatDayLong(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseDateOnly(dateStr));
}

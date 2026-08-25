import { routes } from "@/content/navigation";
import { SITE_TIMEZONE } from "@/content/timezone";
import type { CalendarEvent } from "@/content/calendar";
import { wallClockToInstant } from "@/lib/recruitingTime";

/**
 * Which calendar_events row is "the Ideathon" — the general internal_link
 * field (migrations/0012) pointed at this page, not a title match or a
 * dedicated boolean column. Both the page's countdown and the signup
 * route's "still open" check (app/api/ideathon/route.ts) read through this
 * one module, so they can never disagree about which row is current.
 */

export function isIdeathonEvent(event: CalendarEvent): boolean {
  return event.internalLink === routes.ideathon;
}

/**
 * The instant a linked Ideathon event actually starts. Midnight
 * SITE_TIMEZONE on start_date when no start_time is set — the fallback
 * exists only so this function always returns *some* instant to compare
 * "has it started" against; it is deliberately never used to drive a
 * seconds-precision countdown display (lib/ideathonCountdown.ts falls back
 * to whole days instead) so the page never shows more precision than the
 * board actually entered.
 */
export function ideathonStartInstant(event: CalendarEvent): Date {
  const time = event.startTime ?? "00:00";
  return wallClockToInstant(`${event.startDate}T${time}`, SITE_TIMEZONE);
}

/**
 * The soonest calendar_events row linked to /ideathon that hasn't started
 * yet. Null once nothing is upcoming — the page renders its quiet state,
 * the signup route rejects with 409; neither invents a fallback date.
 *
 * Deliberately excludes an event that has already started, even mid-run:
 * this is the one signal the signup form's open/closed gate reads (via
 * app/api/ideathon/route.ts), and reopening it during the live event would
 * be wrong. Anything that wants to keep showing dates *during* the event
 * (the hero's facts row, the countdown, the timeline's day labels) reads
 * findCurrentIdeathonEvent below instead, not this one.
 */
export function findNextIdeathonEvent(events: CalendarEvent[], nowMs: number): CalendarEvent | null {
  const upcoming = events
    .filter(isIdeathonEvent)
    .filter((event) => ideathonStartInstant(event).getTime() > nowMs)
    .sort((a, b) => ideathonStartInstant(a).getTime() - ideathonStartInstant(b).getTime());
  return upcoming[0] ?? null;
}

/**
 * The linked Ideathon event that is running right now, i.e. today falls
 * between its start and end date (inclusive, whole days in SITE_TIMEZONE).
 * Exists so the countdown can tell "the date isn't set yet" apart from
 * "it's happening this very moment" once findNextIdeathonEvent above has
 * already stopped returning the event — the countdown reaching zero isn't
 * the same fact as no Ideathon being scheduled.
 */
export function findCurrentIdeathonEvent(events: CalendarEvent[], nowMs: number): CalendarEvent | null {
  const current = events.filter(isIdeathonEvent).find((event) => {
    const startMs = wallClockToInstant(`${event.startDate}T00:00`, SITE_TIMEZONE).getTime();
    const endDate = event.endDate ?? event.startDate;
    const endMs = wallClockToInstant(`${endDate}T23:59`, SITE_TIMEZONE).getTime();
    return nowMs >= startMs && nowMs <= endMs;
  });
  return current ?? null;
}

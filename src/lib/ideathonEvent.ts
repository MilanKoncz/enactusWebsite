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
 */
export function findNextIdeathonEvent(events: CalendarEvent[], nowMs: number): CalendarEvent | null {
  const upcoming = events
    .filter(isIdeathonEvent)
    .filter((event) => ideathonStartInstant(event).getTime() > nowMs)
    .sort((a, b) => ideathonStartInstant(a).getTime() - ideathonStartInstant(b).getTime());
  return upcoming[0] ?? null;
}

import type { CalendarEvent } from "@/content/calendar";
import { daysBetween, todayInSiteTimezone } from "@/lib/calendarAgenda";
import { ideathonStartInstant } from "@/lib/ideathonEvent";

/**
 * The /ideathon countdown's display resolution follows the data, not the
 * other way around (2026-08-25 board feedback): a fully-known start_time
 * gets a live days/hours/minutes/seconds ticker; a date-only row (no
 * start_time yet) gets a whole-days count and nothing finer — never a
 * midnight-assumed ticker that *looks* precise but isn't. The moment a
 * board member fills in the real start time via /admin/termine, the exact
 * same event object carries a startTime and this function switches
 * resolution on its own — no separate flag anywhere to keep in sync.
 */
export type IdeathonCountdown =
  | { resolution: "days"; days: number }
  | { resolution: "exact"; days: number; hours: number; minutes: number; seconds: number };

export function ideathonCountdownFor(event: CalendarEvent, nowMs: number): IdeathonCountdown | null {
  const targetMs = ideathonStartInstant(event).getTime();
  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) return null;

  if (!event.startTime) {
    const days = daysBetween(todayInSiteTimezone(nowMs), event.startDate);
    return { resolution: "days", days: Math.max(days, 0) };
  }

  return {
    resolution: "exact",
    days: Math.floor(diffMs / 86_400_000),
    hours: Math.floor((diffMs % 86_400_000) / 3_600_000),
    minutes: Math.floor((diffMs % 3_600_000) / 60_000),
    seconds: Math.floor((diffMs % 60_000) / 1_000),
  };
}

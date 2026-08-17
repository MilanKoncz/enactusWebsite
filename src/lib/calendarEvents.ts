import { unstable_cache as nextCache } from "next/cache";
import { listCalendarEvents } from "@/lib/db";
import type { CalendarEvent } from "@/content/calendar";

/**
 * The public-facing view of the events the board manages at /admin/termine
 * (lib/db.ts's listCalendarEvents). Cached and revalidated on a tag, not
 * read fresh on every request — same reasoning and same shape as
 * lib/recruitingWindows.ts: the homepage is the highest-traffic page on the
 * site, and hitting Neon on every visitor would turn it into a database
 * load test.
 *
 * Fail-soft on purpose: a database hiccup here shows the calendar section's
 * own empty state, not a broken homepage. It's also what keeps `next build`
 * green without DATABASE_URL — the underlying call fails once during
 * prerendering, this catches it, and the page prerenders with an empty list.
 */
export const CALENDAR_EVENTS_TAG = "calendar-events";

// See recruitingWindows.ts's comment on `{ expire: 0 }`: an admin edit at
// /admin/termine needs to be visible on the next homepage load, not after
// the hour-long fallback below expires.
export const CALENDAR_EVENTS_REVALIDATE = { expire: 0 } as const;

async function loadCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const rows = await listCalendarEvents();
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      titleEn: row.titleEn,
      category: row.category,
      startDate: row.startDate,
      endDate: row.endDate,
      startTime: row.startTime,
      endTime: row.endTime,
      location: row.location,
      description: row.description,
      descriptionEn: row.descriptionEn,
      tentative: row.tentative,
    }));
  } catch (error) {
    console.error("Failed to load calendar events", error);
    return [];
  }
}

export const getCalendarEvents: () => Promise<CalendarEvent[]> = nextCache(
  loadCalendarEvents,
  ["calendar-events"],
  { tags: [CALENDAR_EVENTS_TAG], revalidate: 3600 },
);

/**
 * A single `Date.now()` read, isolated in its own plain function rather
 * than called directly inside the homepage's component body: React's
 * hooks-purity lint rule (react-hooks/purity) rejects an impure call
 * (Date.now, Math.random, ...) inside a component's render, since its
 * result could change between renders of what's supposed to be the same
 * output. This value is only ever meant to be read once, at the point the
 * page itself renders, and passed down as a prop from there — see
 * EventCalendar's own comment on why.
 */
export function getServerNowMs(): number {
  return Date.now();
}

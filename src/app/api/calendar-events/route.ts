import { NextResponse } from "next/server";
import { getCalendarEvents } from "@/lib/calendarEvents";

/**
 * Lets EventCalendar.tsx (the one client component reading calendar data)
 * refresh after hydration, on top of the value the homepage already passes
 * down as a prop from its own build/ISR-time getCalendarEvents() call —
 * same two reasons as /api/recruiting-windows:
 *
 * 1. Testability. A value baked into a static page at build time has no
 *    seam Playwright's page.route() can intercept; routing it through a
 *    fetchable endpoint restores one, the same way every DB-backed form on
 *    this site already works.
 * 2. Freshness. The static homepage can be up to an hour stale
 *    (revalidate: 3600) between a board edit and the next ISR
 *    regeneration; this route always reads the same cache but is checked
 *    on every real visit.
 *
 * No auth, no rate limit: this returns exactly the same public data that's
 * already embedded in the homepage's own HTML source.
 */
export async function GET() {
  const events = await getCalendarEvents();
  return NextResponse.json({ events });
}

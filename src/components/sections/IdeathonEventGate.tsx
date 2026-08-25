"use client";

import { useEffect, useState } from "react";
import { IdeathonHero } from "@/components/sections/IdeathonHero";
import { IdeathonTimeline } from "@/components/sections/IdeathonTimeline";
import { IdeathonBenefits } from "@/components/sections/IdeathonBenefits";
import { IdeathonSteps } from "@/components/sections/IdeathonSteps";
import { useNow } from "@/lib/useNow";
import { findCurrentIdeathonEvent, findNextIdeathonEvent } from "@/lib/ideathonEvent";
import type { CalendarEvent } from "@/content/calendar";

export type IdeathonEventGateProps = {
  /** The page's own build/ISR-time getCalendarEvents() call — correct in
   * production, empty in a build with no database (docs' documented trap:
   * `next build` must succeed without one). */
  events: CalendarEvent[];
  /** The server's own render-time clock, so the very first client render
   * resolves the same `nextEvent` the server already put in the HTML —
   * same reasoning as EventCalendar.tsx's `initialNowMs`. */
  initialNowMs: number;
};

/**
 * Re-fetches calendar_events itself (GET /api/calendar-events) and prefers
 * that result once it arrives, the same "prefer the fresh fetch, fall back
 * to the build-time prop" pattern MitmachenApplication.tsx and
 * EventCalendar.tsx already use — and for the same two reasons: the static
 * page can be up to an hour stale between an admin edit and the next ISR
 * regeneration, and a value baked into a static page at build time has no
 * seam Playwright's page.route() can intercept, unlike a real fetch.
 *
 * The one client component on the sections that need to know which
 * calendar_events row is "the Ideathon" (Hero's facts and countdown, the
 * timeline's day labels, the signup form's open/closed gate) — everything
 * else on the page (Benefits, the partner band, FAQ, the closing CTA)
 * doesn't depend on this and stays outside it.
 */
export function IdeathonEventGate({ events: initialEvents, initialNowMs }: IdeathonEventGateProps) {
  const [events, setEvents] = useState(initialEvents);
  const now = useNow(60_000);
  const mounted = now > 0;

  useEffect(() => {
    fetch("/api/calendar-events")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { events?: CalendarEvent[] } | null) => {
        if (body?.events) setEvents(body.events);
      })
      .catch(() => {
        // Left as the build/ISR-time value — a same-origin GET with no
        // external dependency failing outright would mean the site itself
        // is unreachable.
      });
  }, []);

  const referenceNowMs = mounted ? now : initialNowMs;
  const nextEvent = findNextIdeathonEvent(events, referenceNowMs);
  const currentEvent = findCurrentIdeathonEvent(events, referenceNowMs);

  return (
    <>
      <IdeathonHero nextEvent={nextEvent} currentEvent={currentEvent} />
      <IdeathonTimeline nextEvent={nextEvent} currentEvent={currentEvent} />
      <IdeathonBenefits />
      <IdeathonSteps nextEvent={nextEvent} currentEvent={currentEvent} />
    </>
  );
}

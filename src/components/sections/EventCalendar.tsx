"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { EventCalendarGrid } from "@/components/sections/EventCalendarGrid";
import { EventAgenda } from "@/components/sections/EventAgenda";
import { cn } from "@/lib/cn";
import { filterByCategories, visibleCategories } from "@/lib/calendarAgenda";
import type { CalendarCategory, CalendarEvent } from "@/content/calendar";

export type EventCalendarProps = {
  events: CalendarEvent[];
  /**
   * The server's own render-time clock (epoch ms) — used by both views for
   * everything that decides *which* content shows (the highlighted event,
   * which day is "today", which rows dim as past). Baked into the page's
   * HTML the same way initialRecruitingWindows is, so the first client
   * render agrees with the server exactly and nothing visibly reorganises
   * itself right after hydration.
   */
  initialNowMs: number;
};

export function EventCalendar({ events, initialNowMs }: EventCalendarProps) {
  const t = useTranslations("EventCalendar");
  const tCategories = useTranslations("CalendarCategories");
  const [selected, setSelected] = useState<CalendarCategory[]>([]);
  const [liveEvents, setLiveEvents] = useState(events);

  useEffect(() => {
    fetch("/api/calendar-events")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { events?: CalendarEvent[] } | null) => {
        if (body?.events) setLiveEvents(body.events);
      })
      .catch(() => {
        // Same reasoning as MitmachenApplication.tsx's equivalent fetch:
        // left as the build-time value, since a same-origin GET failing
        // outright would mean the site itself is unreachable.
      });
  }, []);

  const categories = visibleCategories(liveEvents);
  const filtered = filterByCategories(liveEvents, selected);

  function toggleCategory(category: CalendarCategory) {
    setSelected((previous) =>
      previous.includes(category) ? previous.filter((c) => c !== category) : [...previous, category],
    );
  }

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col gap-10">
        {/* /termine has no separate intro section — same reasoning as
            EventsIntro.tsx: this carries the page's one h1. */}
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />

        {liveEvents.length === 0 ? (
          <p className="rounded-md border border-dashed border-ink/20 p-6 text-center text-body-m opacity-60">
            {t("empty")}
          </p>
        ) : (
          <>
            {categories.length > 0 && (
              // The fade is a static hint, not a scroll-position-aware one:
              // simple, and enough to signal "more chips this way" without a
              // scroll listener for what's otherwise a two-second glance.
              <div className="relative">
                <div
                  role="group"
                  aria-label={t("filterLabel")}
                  // contain-content (paint containment) used to clip this
                  // track at its own padding edge — including a focused
                  // chip's outline and a pressed chip's ring, which need a
                  // few px above/below the row to render at all. overflow-x
                  // forces overflow-y to the same "auto" (the CSS spec ties
                  // the two together once either axis isn't "visible"), so
                  // the fix isn't the contain property, it's giving the
                  // clipped box enough padding to hold what paints outside
                  // the chips themselves. -my-2 cancels the added padding's
                  // effect on the surrounding gap-10 rhythm.
                  className="flex gap-3 overflow-x-auto contain-content py-2 -my-2"
                >
                  {categories.map((category) => {
                    const pressed = selected.includes(category);
                    return (
                      <button
                        key={category}
                        type="button"
                        aria-pressed={pressed}
                        onClick={() => toggleCategory(category)}
                        className="shrink-0 rounded-sm transition-transform duration-[var(--duration-fast)] ease-signature hover:-translate-y-px focus-visible:-translate-y-px"
                      >
                        <CategoryBadge
                          category={category}
                          className={cn(pressed && "ring-2 ring-ink/30 ring-offset-1 ring-offset-paper")}
                        />
                        <span className="sr-only"> ({tCategories(category)})</span>
                      </button>
                    );
                  })}
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-paper to-transparent sm:hidden"
                />
              </div>
            )}

            {filtered.length === 0 ? (
              <p className="rounded-md border border-dashed border-ink/20 p-6 text-center text-body-m opacity-60">
                {t("emptyFiltered")}
              </p>
            ) : (
              <>
                {/* Both views render at once; only one is ever visible.
                    Neither useMediaQuery (server snapshot false, so the
                    grid would flash in only after hydration on desktop)
                    nor mounting one view lazily is used — a hidden
                    md:block/md:hidden pair costs nothing here and keeps
                    the right view present in the very first paint on
                    either breakpoint. */}
                <div className="hidden md:block">
                  <EventCalendarGrid events={filtered} initialNowMs={initialNowMs} />
                </div>
                <div className="md:hidden">
                  <EventAgenda events={filtered} initialNowMs={initialNowMs} />
                </div>
              </>
            )}
          </>
        )}
      </Container>
    </Section>
  );
}

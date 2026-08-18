"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryBadge, CATEGORY_LEFT_BORDER_CLASS } from "@/components/ui/CategoryBadge";
import { AddToCalendarLink, EventMeta, EventRow, TentativeNote } from "@/components/ui/EventDetails";
import { EventCalendarGrid } from "@/components/sections/EventCalendarGrid";
import { cn } from "@/lib/cn";
import { useNow } from "@/lib/useNow";
import { formatEventDate, formatMonthHeading } from "@/lib/calendarFormat";
import {
  countdownFor,
  filterByCategories,
  groupByMonth,
  isPastEvent,
  nextUpcomingEvent,
  splitMonthGroups,
  visibleCategories,
} from "@/lib/calendarAgenda";
import type { CalendarCategory, CalendarEvent } from "@/content/calendar";

export type EventCalendarProps = {
  events: CalendarEvent[];
  /**
   * The server's own render-time clock (epoch ms) — used for everything
   * that decides *which* content shows (the highlighted event, which
   * months collapse behind "earlier events", which rows dim as past).
   * Baked into the page's HTML the same way initialRecruitingWindows is, so
   * the first client render agrees with the server exactly and nothing
   * visibly reorganises itself right after hydration. useNow()'s own
   * ticking clock (below) drives only the countdown phrase's text, never
   * which event or month is shown — see its own comment.
   */
  initialNowMs: number;
};

export function EventCalendar({ events, initialNowMs }: EventCalendarProps) {
  const t = useTranslations("EventCalendar");
  const tCategories = useTranslations("CalendarCategories");
  const locale = useLocale();
  const [selected, setSelected] = useState<CalendarCategory[]>([]);
  const [showEarlier, setShowEarlier] = useState(false);
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

  // useNow ticks from 0 (server/pre-mount) to the real clock — never used
  // to pick *what* is shown (see initialNowMs above), only whether the
  // countdown phrase is allowed to render at all: 0 means "not mounted
  // yet", and the countdown stays hidden rather than showing a nonsense
  // day count computed against the Unix epoch.
  const now = useNow(60_000);
  const mounted = now > 0;

  const categories = visibleCategories(liveEvents);
  const filtered = filterByCategories(liveEvents, selected);
  const highlighted = nextUpcomingEvent(filtered, initialNowMs);
  // The highlighted card already shows this event in full — repeating it a
  // second time immediately below, in the grouped list, would read as a
  // rendering mistake rather than emphasis.
  const eventsForList = highlighted ? filtered.filter((event) => event.id !== highlighted.id) : filtered;
  const groups = groupByMonth(eventsForList);
  const { earlierMonths, currentAndLaterMonths } = splitMonthGroups(groups, initialNowMs);

  function toggleCategory(category: CalendarCategory) {
    setSelected((previous) =>
      previous.includes(category) ? previous.filter((c) => c !== category) : [...previous, category],
    );
  }

  const countdown = highlighted && mounted ? countdownFor(highlighted, now) : null;
  const countdownLabel =
    countdown?.state === "today"
      ? t("highlight.today")
      : countdown?.state === "tomorrow"
        ? t("highlight.tomorrow")
        : countdown?.state === "future"
          ? t("highlight.inDays", { days: countdown.days })
          : null;

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />

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
                    the desktop view present in the very first paint. */}
                <div className="hidden md:block">
                  <EventCalendarGrid events={filtered} initialNowMs={initialNowMs} />
                </div>
                <div className="flex flex-col gap-10 md:hidden">
                {highlighted && (
                  <Card
                    className={cn(
                      "flex flex-col gap-3 border-l-4 p-6",
                      CATEGORY_LEFT_BORDER_CLASS[highlighted.category],
                      highlighted.tentative && "border-dashed border-gold",
                    )}
                  >
                    <p className="font-mono text-mono-xs uppercase opacity-60">{t("highlight.eyebrow")}</p>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-heading-2 font-display">{highlighted.title}</h3>
                      <CategoryBadge category={highlighted.category} />
                    </div>
                    <p className="text-body-l">{formatEventDate(highlighted, locale)}</p>
                    {countdownLabel && (
                      <p className="font-mono text-mono-s uppercase opacity-60">{countdownLabel}</p>
                    )}
                    <EventMeta event={highlighted} />
                    {highlighted.tentative && <TentativeNote label={t("tentativeLabel")} />}
                    <AddToCalendarLink eventId={highlighted.id} label={t("addToCalendar")} size="md" />
                  </Card>
                )}

                {earlierMonths.length > 0 && (
                  <button
                    type="button"
                    aria-expanded={showEarlier}
                    onClick={() => setShowEarlier((value) => !value)}
                    className="flex items-center gap-2 self-start rounded-sm py-1 font-mono text-mono-s uppercase opacity-60 transition-[opacity,transform] duration-[var(--duration-fast)] ease-signature hover:opacity-100 focus-visible:opacity-100"
                  >
                    <ChevronUp
                      aria-hidden="true"
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-[var(--duration-fast)] ease-signature",
                        !showEarlier && "rotate-180",
                      )}
                    />
                    {t("earlierMonths")}
                  </button>
                )}

                {showEarlier &&
                  earlierMonths.map((group) => (
                    <div key={group.monthKey} className="flex flex-col gap-4">
                      <h3 className="font-mono text-mono-s uppercase opacity-60">
                        {formatMonthHeading(group.monthKey, locale)}
                      </h3>
                      <ul className="flex flex-col gap-3">
                        {group.events.map((event) => (
                          <EventRow
                            key={event.id}
                            event={event}
                            past
                            locale={locale}
                            tentativeLabel={t("tentativeLabel")}
                            addToCalendarLabel={t("addToCalendar")}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}

                {currentAndLaterMonths.map((group) => (
                  <div key={group.monthKey} className="flex flex-col gap-4">
                    <h3 className="font-mono text-mono-s uppercase opacity-60">
                      {formatMonthHeading(group.monthKey, locale)}
                    </h3>
                    <ul className="flex flex-col gap-3">
                      {group.events.map((event) => (
                        <EventRow
                          key={event.id}
                          event={event}
                          past={isPastEvent(event, initialNowMs)}
                          locale={locale}
                          tentativeLabel={t("tentativeLabel")}
                          addToCalendarLabel={t("addToCalendar")}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
                </div>
              </>
            )}
          </>
        )}
      </Container>
    </Section>
  );
}

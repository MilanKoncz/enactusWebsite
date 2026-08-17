"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronUp, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryBadge, CATEGORY_LEFT_BORDER_CLASS } from "@/components/ui/CategoryBadge";
import { cn } from "@/lib/cn";
import { useNow } from "@/lib/useNow";
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

// Parses a plain "YYYY-MM-DD" as a UTC calendar date and always formats it
// back with an explicit UTC timeZone — the round trip is then independent
// of whichever timezone the server or the visitor's browser happens to run
// in, so the server-rendered and first client-rendered text can never
// disagree (the calendar_events columns have no time-of-day component to
// begin with, see migrations/0006_calendar_events.sql).
function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatEventDate(event: CalendarEvent, locale: string): string {
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

function formatMonthHeading(monthKey: string, locale: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

function formatEventTime(event: CalendarEvent): string | null {
  if (!event.startTime) return null;
  return event.endTime ? `${event.startTime}–${event.endTime}` : event.startTime;
}

function EventMeta({ event }: { event: CalendarEvent }) {
  const time = formatEventTime(event);
  if (!time && !event.location) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-s">
      {time && <span className="font-mono tabular-nums">{time}</span>}
      {event.location && (
        <span className="inline-flex items-center gap-1">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
          {event.location}
        </span>
      )}
    </p>
  );
}

function TentativeNote({ label }: { label: string }) {
  return <p className="text-body-s opacity-60">{label}</p>;
}

/**
 * One row of the agenda list. Past events dim their title and meta text to
 * ink/60 on paper (this project's documented minimum for muted text) but
 * keep the category badge — icon, name, and color — at full strength: a
 * graphical label reads fine at full saturation even once the words around
 * it go quiet (docs/design-system.md's "Calendar category colors" section).
 */
function EventRow({ event, past, locale, tentativeLabel }: {
  event: CalendarEvent;
  past: boolean;
  locale: string;
  tentativeLabel: string;
}) {
  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-md border border-ink/10 p-4",
        event.tentative && "border-dashed border-gold",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className={cn("flex flex-col gap-1", past && "opacity-60")}>
          <p className="text-body-l font-medium">{event.title}</p>
          <p className="text-body-s">{formatEventDate(event, locale)}</p>
        </div>
        <CategoryBadge category={event.category} past={past} />
      </div>
      <div className={cn(past && "opacity-60")}>
        <EventMeta event={event} />
      </div>
      {event.tentative && <TentativeNote label={tentativeLabel} />}
    </li>
  );
}

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
              <div
                role="group"
                aria-label={t("filterLabel")}
                className="flex gap-3 overflow-x-auto contain-content pb-1"
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
            )}

            {filtered.length === 0 ? (
              <p className="rounded-md border border-dashed border-ink/20 p-6 text-center text-body-m opacity-60">
                {t("emptyFiltered")}
              </p>
            ) : (
              <div className="flex flex-col gap-10">
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
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Container>
    </Section>
  );
}

"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CATEGORY_BAR_CLASS, CategoryBadge } from "@/components/ui/CategoryBadge";
import { AddToCalendarLink, EventMeta, TentativeNote } from "@/components/ui/EventDetails";
import { cn } from "@/lib/cn";
import { useNow } from "@/lib/useNow";
import { formatEventDate, formatMonthHeading, parseDateOnly } from "@/lib/calendarFormat";
import { countdownFor, groupByMonth, isPastEvent, nextUpcomingEvent, splitMonthGroups } from "@/lib/calendarAgenda";
import type { CalendarEvent } from "@/content/calendar";

type Translator = ReturnType<typeof useTranslations>;

/**
 * One collapsed line: weekday + day number in a fixed-width mono column, a
 * category color dot (its name carried as sr-only text, since color alone
 * would otherwise be the only signal while collapsed), and the title. Time,
 * location, the full category badge, and the ICS button only appear once
 * expanded — a real disclosure (aria-expanded, keyboard and tap operable),
 * not a hover reveal: "hover enhances, hover never hides"
 * (docs/design-system.md) is a rule about hover, not about a control the
 * visitor deliberately activates.
 */
function AgendaRow({
  event,
  past,
  highlighted,
  countdownLabel,
  locale,
  t,
  tCategories,
}: {
  event: CalendarEvent;
  past: boolean;
  highlighted: boolean;
  countdownLabel: string | null;
  locale: string;
  t: Translator;
  tCategories: Translator;
}) {
  const [expanded, setExpanded] = useState(false);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(
    parseDateOnly(event.startDate),
  );
  const dayNumber = Number(event.startDate.slice(8, 10));

  return (
    <li
      className={cn(
        "rounded-md border border-ink/10",
        event.tentative && "border-dashed border-gold",
        // The gate-marker motif (docs/design-system.md) applied to the
        // agenda's own highlighted row — gold, not the event's own category
        // color, since this marks "next up" regardless of category.
        highlighted && "border-l-4 border-l-gold",
      )}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full flex-col gap-1 rounded-md p-3 text-left transition-colors duration-[var(--duration-fast)] ease-signature hover:bg-ink/5 focus-visible:bg-ink/5"
      >
        {highlighted && (
          <span className="font-mono text-mono-xs uppercase opacity-60">{t("highlight.eyebrow")}</span>
        )}
        <span className={cn("flex items-center gap-3", past && "opacity-60")}>
          <span className="w-12 shrink-0 font-mono text-mono-xs uppercase tabular-nums opacity-60">
            {weekday} {dayNumber}
          </span>
          <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", CATEGORY_BAR_CLASS[event.category])} />
          <span className="min-w-0 flex-1 truncate text-body-m font-medium">{event.title}</span>
          {highlighted && countdownLabel && (
            <span className="shrink-0 font-mono text-mono-xs uppercase opacity-60">{countdownLabel}</span>
          )}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 opacity-60 transition-transform duration-[var(--duration-fast)] ease-signature",
              expanded && "rotate-180",
            )}
          />
          <span className="sr-only">
            {" "}
            {tCategories(event.category)}, {expanded ? t("agenda.collapseLabel") : t("agenda.expandLabel")}
          </span>
        </span>
      </button>
      {expanded && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={cn("text-body-s", past && "opacity-60")}>{formatEventDate(event, locale)}</p>
            <CategoryBadge category={event.category} past={past} />
          </div>
          <div className={cn(past && "opacity-60")}>
            <EventMeta event={event} />
          </div>
          {event.tentative && <TentativeNote label={t("tentativeLabel")} />}
          {/* Adding a past event to a calendar app has no use — the button
              only appears once a row is still ahead of "today". */}
          {!past && <AddToCalendarLink eventId={event.id} label={t("addToCalendar")} size="sm" />}
        </div>
      )}
    </li>
  );
}

export type EventAgendaProps = {
  /** Already category-filtered by the shell — the same list the month grid
   * renders, so both views ever show the same events. */
  events: CalendarEvent[];
  initialNowMs: number;
};

export function EventAgenda({ events, initialNowMs }: EventAgendaProps) {
  const t = useTranslations("EventCalendar");
  const tCategories = useTranslations("CalendarCategories");
  const locale = useLocale();
  const [showEarlier, setShowEarlier] = useState(false);

  // useNow ticks from 0 (server/pre-mount) to the real clock — never used to
  // pick which event is highlighted (that's initialNowMs, below), only
  // whether the countdown phrase is allowed to render at all: 0 means "not
  // mounted yet", and the countdown stays hidden rather than showing a
  // nonsense day count computed against the Unix epoch.
  const now = useNow(60_000);
  const mounted = now > 0;

  const highlighted = nextUpcomingEvent(events, initialNowMs);
  const groups = groupByMonth(events);
  const { earlierMonths, currentAndLaterMonths } = splitMonthGroups(groups, initialNowMs);

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
    <div className="flex flex-col gap-6">
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
          <div key={group.monthKey} className="flex flex-col gap-3">
            <h3 className="font-mono text-mono-s uppercase opacity-60">{formatMonthHeading(group.monthKey, locale)}</h3>
            <ul className="flex flex-col gap-2">
              {group.events.map((event) => (
                <AgendaRow
                  key={event.id}
                  event={event}
                  past
                  highlighted={false}
                  countdownLabel={null}
                  locale={locale}
                  t={t}
                  tCategories={tCategories}
                />
              ))}
            </ul>
          </div>
        ))}

      {currentAndLaterMonths.map((group) => (
        <div key={group.monthKey} className="flex flex-col gap-3">
          <h3 className="font-mono text-mono-s uppercase opacity-60">{formatMonthHeading(group.monthKey, locale)}</h3>
          <ul className="flex flex-col gap-2">
            {group.events.map((event) => (
              <AgendaRow
                key={event.id}
                event={event}
                past={isPastEvent(event, initialNowMs)}
                highlighted={highlighted?.id === event.id}
                countdownLabel={highlighted?.id === event.id ? countdownLabel : null}
                locale={locale}
                t={t}
                tCategories={tCategories}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

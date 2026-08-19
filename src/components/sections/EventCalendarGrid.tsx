"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CATEGORY_BAR_CLASS,
  CATEGORY_BAR_TENTATIVE_CLASS,
  CATEGORY_LEFT_BORDER_CLASS,
} from "@/components/ui/CategoryBadge";
import { EventRow } from "@/components/ui/EventDetails";
import { cn } from "@/lib/cn";
import { formatDayLong, formatMonthHeading } from "@/lib/calendarFormat";
import { currentMonthKey, isPastEvent, todayInSiteTimezone } from "@/lib/calendarAgenda";
import {
  addDays,
  addMonths,
  eventsOnDay,
  firstMonthWithEvents,
  monthKeyOf,
  monthWeeks,
  weekBars,
  type MonthKey,
} from "@/lib/calendarMonth";
import type { CalendarEvent } from "@/content/calendar";

const MAX_LANES = 3;

/** The true days of a month, excluding the leading/trailing padding from
 * neighbouring months that monthWeeks always includes to fill 6 rows. */
function trueDaysOf(month: MonthKey): string[] {
  return monthWeeks(month)
    .flat()
    .filter((date) => monthKeyOf(date) === month);
}

/** The month the grid should open on: the current month, or the next one
 * that actually has an event. Shared by every default computed below so
 * they can never disagree with each other about which month "jumped" means. */
function defaultViewMonth(events: CalendarEvent[], currentMonth: MonthKey): MonthKey {
  return firstMonthWithEvents(events, currentMonth) ?? currentMonth;
}

function defaultFocusedDate(events: CalendarEvent[], currentMonth: MonthKey, today: string): string {
  const month = defaultViewMonth(events, currentMonth);
  return month === currentMonth ? today : `${month}-01`;
}

function defaultSelectedDate(events: CalendarEvent[], currentMonth: MonthKey, today: string): string | null {
  const month = defaultViewMonth(events, currentMonth);
  return month === currentMonth ? today : null;
}

export type EventCalendarGridProps = {
  /** Already category-filtered by the shell — the same list the mobile
   * agenda view renders, so both views ever show the same events. */
  events: CalendarEvent[];
  initialNowMs: number;
};

export function EventCalendarGrid({ events, initialNowMs }: EventCalendarGridProps) {
  const t = useTranslations("EventCalendar");
  const locale = useLocale();
  const monthHeadingId = useId();
  const gridLabelId = useId();

  const today = todayInSiteTimezone(initialNowMs);
  const currentMonth = currentMonthKey(initialNowMs);
  // Lazy initializers give the very first paint a value straight away, from
  // whichever event list is available at that moment (the build-time
  // snapshot the static homepage bakes in).
  const [viewMonth, setViewMonth] = useState<MonthKey>(() => defaultViewMonth(events, currentMonth));
  const [focusedDate, setFocusedDate] = useState<string>(() => defaultFocusedDate(events, currentMonth, today));
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    defaultSelectedDate(events, currentMonth, today),
  );
  const [hasNavigated, setHasNavigated] = useState(false);

  // Refines the initial guess once EventCalendar's own client-side re-fetch
  // replaces the build-time snapshot with fresher data — the homepage is
  // fully static (next build must succeed without a database), so a real
  // board edit since the last build only ever shows up here, in this one
  // post-mount update, never in the very first paint. Adjusting state
  // during render (not in an effect) on a prop-identity change is the
  // pattern React itself recommends for this — it re-renders immediately
  // with the corrected state instead of committing a stale frame first.
  // Skipped once the user has navigated on their own, so this can never
  // yank their view out from under them.
  const [settledEvents, setSettledEvents] = useState(events);
  if (events !== settledEvents) {
    setSettledEvents(events);
    if (!hasNavigated) {
      setViewMonth(defaultViewMonth(events, currentMonth));
      setFocusedDate(defaultFocusedDate(events, currentMonth, today));
      setSelectedDate(defaultSelectedDate(events, currentMonth, today));
    }
  }

  const cellRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pendingFocusRef = useRef(false);

  const weeks = monthWeeks(viewMonth);
  const showJumpedNote = !hasNavigated && viewMonth !== currentMonth;

  // Every focus-moving path funnels through here, so this is also the one
  // place that marks the user as having navigated — including a bare arrow
  // key that never leaves the current month. Without that, an unrelated
  // re-render further up the tree (the agenda's countdown ticks every 60s,
  // producing a new but content-equal events array) would hit the
  // render-time adjustment above and silently reset focusedDate back to
  // its default, out from under a keyboard user who moved it but hasn't
  // pressed Enter yet.
  function focusCell(date: string) {
    setHasNavigated(true);
    pendingFocusRef.current = true;
    setFocusedDate(date);
  }

  function goToMonth(nextMonth: MonthKey, nextFocus: string) {
    setViewMonth(nextMonth);
    focusCell(nextFocus);
  }

  // Shared by every "move to this date" path (arrows, Home, End): a target
  // outside the currently displayed month switches the month first, so
  // focus is never asked to land on a dimmed, non-selectable padding day —
  // not just across a month's own edge, but also when a week row's own
  // start or end happens to belong to the neighbouring month.
  function focusTarget(target: string) {
    const targetMonth = monthKeyOf(target);
    if (targetMonth !== viewMonth) {
      goToMonth(targetMonth, target);
      return;
    }
    focusCell(target);
  }

  function moveFocusByDays(delta: number) {
    focusTarget(addDays(focusedDate, delta));
  }

  function pageMonth(delta: number) {
    const dayOfMonth = Number(focusedDate.slice(8, 10));
    const nextMonth = addMonths(viewMonth, delta);
    const nextMonthDays = trueDaysOf(nextMonth);
    const clampedDay = Math.min(dayOfMonth, nextMonthDays.length);
    goToMonth(nextMonth, nextMonthDays[clampedDay - 1]);
  }

  function goToToday() {
    setViewMonth(currentMonth);
    setSelectedDate(today);
    focusCell(today);
  }

  function handleCellActivate(date: string) {
    setSelectedDate(date);
    focusCell(date);
  }

  function handleGridKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        moveFocusByDays(1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        moveFocusByDays(-1);
        break;
      case "ArrowDown":
        e.preventDefault();
        moveFocusByDays(7);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocusByDays(-7);
        break;
      case "Home": {
        e.preventDefault();
        const week = weeks.find((row) => row.includes(focusedDate));
        if (week) focusTarget(week[0]);
        break;
      }
      case "End": {
        e.preventDefault();
        const week = weeks.find((row) => row.includes(focusedDate));
        if (week) focusTarget(week[6]);
        break;
      }
      case "PageUp":
        e.preventDefault();
        pageMonth(-1);
        break;
      case "PageDown":
        e.preventDefault();
        pageMonth(1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        handleCellActivate(focusedDate);
        break;
      default:
        break;
    }
  }

  // Runs only after a keyboard/button-driven focus change (pendingFocusRef
  // set by focusCell), never on mount or on a re-render triggered by
  // something else — a roving tabindex grid must move real DOM focus when
  // the active cell changes, but must never steal focus the page didn't
  // already have.
  useEffect(() => {
    if (!pendingFocusRef.current) return;
    pendingFocusRef.current = false;
    cellRefs.current[focusedDate]?.focus();
  }, [focusedDate, viewMonth]);

  const weekdayLabels = weeks[0].map((date) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(
      new Date(`${date}T00:00:00Z`),
    ),
  );

  const dayEvents = selectedDate ? eventsOnDay(events, selectedDate) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id={monthHeadingId} aria-live="polite" className="text-heading-2 font-display font-normal!">
          {formatMonthHeading(viewMonth, locale)}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToToday()}
            className="rounded-sm border border-ink/20 px-3 py-1.5 font-mono text-mono-xs uppercase transition-colors duration-[var(--duration-fast)] ease-signature hover:bg-ink/5 focus-visible:bg-ink/5"
          >
            {t("grid.today")}
          </button>
          <button
            type="button"
            aria-label={t("grid.previousMonth")}
            onClick={() => goToMonth(addMonths(viewMonth, -1), `${addMonths(viewMonth, -1)}-01`)}
            className="rounded-sm border border-ink/20 p-1.5 transition-colors duration-[var(--duration-fast)] ease-signature hover:bg-ink/5 focus-visible:bg-ink/5"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            aria-label={t("grid.nextMonth")}
            onClick={() => goToMonth(addMonths(viewMonth, 1), `${addMonths(viewMonth, 1)}-01`)}
            className="rounded-sm border border-ink/20 p-1.5 transition-colors duration-[var(--duration-fast)] ease-signature hover:bg-ink/5 focus-visible:bg-ink/5"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      {showJumpedNote && (
        <p className="text-body-s opacity-60">
          {t("grid.jumpedNote", {
            emptyMonth: formatMonthHeading(currentMonth, locale),
            targetMonth: formatMonthHeading(viewMonth, locale),
          })}
        </p>
      )}

      <span id={gridLabelId} className="sr-only">
        {t("grid.label")}
      </span>
      <div
        role="grid"
        aria-labelledby={`${gridLabelId} ${monthHeadingId}`}
        onKeyDown={handleGridKeyDown}
        className="flex flex-col gap-1"
      >
        <div role="row" className="grid grid-cols-7 gap-x-1">
          {weekdayLabels.map((label, index) => (
            <div
              key={index}
              role="columnheader"
              className="py-1 text-center font-mono text-mono-xs uppercase opacity-60"
            >
              {label}
            </div>
          ))}
        </div>

        {weeks.map((week) => {
          const { bars, overflowByDate } = weekBars(events, week, MAX_LANES);
          return (
            <div key={week[0]} role="row" className="relative grid grid-cols-7 gap-x-1">
              {week.map((date) => {
                const isCurrentMonth = monthKeyOf(date) === viewMonth;
                const isToday = date === today;
                const isSelected = date === selectedDate;
                const dayEventsForCell = eventsOnDay(events, date);
                const dayCount = dayEventsForCell.length;
                const dayNumber = Number(date.slice(8, 10));
                // aria-label always wins over an element's own content for
                // the accessible name, so the today-marker (and, below, the
                // event titles) have to be part of this one string directly
                // — a child sr-only span would be silently ignored once the
                // div already has an aria-label. The bars overlay drawn
                // below stays aria-hidden (a `role="row"` may only contain
                // gridcell/columnheader children — a floating, independently
                // labelled bar there fails aria-required-children), so this
                // cell's own label is the only place a screen reader gets
                // each day's event titles, not just their count.
                let cellLabel = t("grid.cellLabel", { date: formatDayLong(date, locale), count: dayCount });
                if (dayCount > 0) {
                  cellLabel += `. ${dayEventsForCell.map((event) => event.title).join(", ")}`;
                }
                if (isToday) {
                  cellLabel += `, ${t("grid.todayMarker")}`;
                }

                return (
                  <div
                    key={date}
                    ref={(el) => {
                      cellRefs.current[date] = el;
                    }}
                    role="gridcell"
                    tabIndex={date === focusedDate ? 0 : -1}
                    aria-selected={isSelected}
                    aria-disabled={!isCurrentMonth || undefined}
                    aria-label={cellLabel}
                    onClick={() => isCurrentMonth && handleCellActivate(date)}
                    className={cn(
                      // Ab lg the bars overlay grows real title text into
                      // it (absolutely positioned, so it never contributes
                      // to this flex box's own height) — min-h grows to
                      // match so that content never bleeds into the row
                      // below instead of just being taller within this one.
                      "flex min-h-16 flex-col items-center gap-1 rounded-sm py-1 font-mono text-mono-s tabular-nums transition-colors duration-[var(--duration-fast)] ease-signature lg:min-h-36",
                      isCurrentMonth ? "cursor-pointer" : "pointer-events-none opacity-30",
                      isSelected ? "bg-ink text-paper" : isCurrentMonth && "hover:bg-ink/5",
                    )}
                  >
                    <span>{dayNumber}</span>
                    {isToday && (
                      // Gold only reads as intended against ink (the
                      // selected state's own fill) — on paper it measures
                      // 1.47:1 and would be nearly invisible as a small
                      // dot, so the default (unselected) marker is ink
                      // instead. Same signal, the surface-appropriate color
                      // (docs/design-system.md's contrast rules).
                      <span aria-hidden="true" className={cn("size-1 rounded-full", isSelected ? "bg-gold" : "bg-ink")} />
                    )}
                  </div>
                );
              })}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-6 grid grid-cols-7 gap-x-1 gap-y-0.5 px-0"
                style={{ gridAutoRows: "1.25rem" }}
              >
                {bars.map((bar) => {
                  // Every WeekBar is already clipped to this one week row, so
                  // `bar.column` is that segment's own first visible day —
                  // for a multi-week event that's a fresh title each week it
                  // continues into, not just once at the event's real start.
                  const clickDate = week[bar.column];
                  return (
                    <span key={bar.event.id} className="contents">
                      {/* md through the point titles get room to breathe
                          (lg) — the plain colored bar this grid always had,
                          no title text: at that width there's only room for
                          two or three characters before the ellipsis, which
                          reads worse than no text at all. */}
                      <span
                        aria-hidden="true"
                        style={{ gridColumn: `${bar.column + 1} / span ${bar.span}`, gridRow: bar.lane + 1 }}
                        className={cn(
                          "self-center h-1.5 lg:hidden",
                          bar.continuesBefore ? "rounded-l-none" : "rounded-l-full",
                          bar.continuesAfter ? "rounded-r-none" : "rounded-r-full",
                          bar.event.tentative
                            ? CATEGORY_BAR_TENTATIVE_CLASS[bar.event.category]
                            : CATEGORY_BAR_CLASS[bar.event.category],
                        )}
                      />
                      {/* Ab lg: the title itself, on a neutral surface — a
                          category color as a left border (the same accent
                          CATEGORY_LEFT_BORDER_CLASS already uses for the
                          agenda's next-event card), not as a fill, so ink
                          text never has to clear contrast against seven
                          different saturated backgrounds. `title` is the
                          mouse tooltip for a name truncated by CSS, not the
                          DOM — the full text is already the cell's own
                          aria-label above (this whole overlay stays
                          aria-hidden, a `role="row"` may only contain
                          gridcell children). pointer-events are re-enabled
                          on just this element (the shared overlay above
                          stays pass-through) so the tooltip actually fires
                          on hover, and clicking it activates the same day
                          the cell underneath does, not a dead click target. */}
                      <span
                        title={bar.event.title}
                        onClick={() => handleCellActivate(clickDate)}
                        style={{ gridColumn: `${bar.column + 1} / span ${bar.span}`, gridRow: bar.lane + 1 }}
                        className={cn(
                          "hidden h-full min-w-0 cursor-pointer items-center overflow-hidden rounded-sm border-l-2 bg-ink/5 px-1.5 pointer-events-auto lg:flex",
                          bar.event.tentative ? "border-dashed" : "border-solid",
                          CATEGORY_LEFT_BORDER_CLASS[bar.event.category],
                        )}
                      >
                        <span className="truncate font-mono text-mono-xs text-ink">{bar.event.title}</span>
                      </span>
                    </span>
                  );
                })}
                {week
                  .map((date, index) => ({ date, index, count: overflowByDate[date] }))
                  .filter((cell) => cell.count)
                  .map(({ date, index, count }) => (
                    <span
                      key={date}
                      style={{ gridColumn: `${index + 1} / span 1`, gridRow: MAX_LANES + 1 }}
                      className="text-center font-mono text-mono-xs leading-none opacity-60"
                    >
                      {t("grid.moreEvents", { count })}
                      <span className="sr-only"> {t("grid.moreEventsLabel", { count })}</span>
                    </span>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="flex flex-col gap-4">
          <h3 className="text-heading-3 font-display font-normal!">{t("grid.dayHeading", { date: formatDayLong(selectedDate, locale) })}</h3>
          {dayEvents.length === 0 ? (
            <p className="rounded-md border border-dashed border-ink/20 p-6 text-center text-body-m opacity-60">
              {t("grid.dayEmpty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {dayEvents.map((event) => (
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
          )}
        </div>
      )}
    </div>
  );
}

import { CalendarPlus, MapPin } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { cn } from "@/lib/cn";
import { formatEventDate, formatEventTime } from "@/lib/calendarFormat";
import type { CalendarEvent } from "@/content/calendar";

/**
 * The pieces of a calendar event's detail that repeat identically across
 * every view that shows one in full — the agenda row, the agenda's
 * highlighted next-event line, and the month grid's day list — extracted
 * from EventCalendar.tsx once a second view needed them rather than a copy.
 */

export function EventMeta({ event }: { event: CalendarEvent }) {
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

export function TentativeNote({ label }: { label: string }) {
  return <p className="text-body-s opacity-60">{label}</p>;
}

// A real <a href download>, not Button's href branch — Button routes an
// href through next-intl's localised Link (lib/navigation.ts), which would
// try to prefix this API route with /en instead of leaving it alone (same
// reasoning as PartnerContact.tsx's mailto link). buttonClasses gives it
// Button's exact look without duplicating those classes by hand.
export function AddToCalendarLink({
  eventId,
  label,
  size,
}: {
  eventId: string;
  label: string;
  size: "sm" | "md";
}) {
  return (
    <a href={`/api/kalender/${eventId}/ics`} download className={buttonClasses("secondary", size, "self-start")}>
      <CalendarPlus aria-hidden="true" className="size-4 shrink-0" />
      {label}
    </a>
  );
}

/**
 * One full event row — title, date, category, meta, and (for an upcoming
 * event) the ICS button. Shared by the agenda list and the month grid's
 * selected-day list, the two places a calendar event ever renders in full;
 * past events dim their title and meta text to ink/60 on paper (this
 * project's documented minimum for muted text) but keep the category badge
 * — icon, name, and color — at full strength: a graphical label reads fine
 * at full saturation even once the words around it go quiet
 * (docs/design-system.md's "Calendar category colors" section).
 */
export function EventRow({
  event,
  past,
  locale,
  tentativeLabel,
  addToCalendarLabel,
}: {
  event: CalendarEvent;
  past: boolean;
  locale: string;
  tentativeLabel: string;
  addToCalendarLabel: string;
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
      {/* Adding a past event to a calendar app has no use — the button
          only appears once a row is still ahead of "today". */}
      {!past && <AddToCalendarLink eventId={event.id} label={addToCalendarLabel} size="sm" />}
    </li>
  );
}

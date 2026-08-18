import { CalendarPlus, MapPin } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { formatEventTime } from "@/lib/calendarFormat";
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

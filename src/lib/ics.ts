import { wallClockToInstant } from "@/lib/recruitingTime";
import { SITE_TIMEZONE } from "@/content/timezone";
import { siteUrl } from "@/lib/siteUrl";
import type { CalendarEvent } from "@/content/calendar";

/**
 * A minimal RFC 5545 (iCalendar) writer for a single event — no library,
 * no third-party service, per the brief. Handles exactly what
 * calendar_events can hold: an all-day or multi-day event, or one with a
 * clock time, optionally without an end time.
 */

const FOLD_LIMIT_OCTETS = 75;

// RFC 5545 §3.1: a content line, including its terminating CRLF, must not
// exceed 75 octets; a continuation line starts with a single space, which
// itself counts toward that limit. Split on octet boundaries (not JS UTF-16
// code units) so a German umlaut in a title or location — multi-byte in
// UTF-8 — never gets sliced in half.
function foldLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= FOLD_LIMIT_OCTETS) return line;

  const parts: string[] = [];
  let start = 0;
  let limit = FOLD_LIMIT_OCTETS;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Back off while the next byte is a UTF-8 continuation byte (10xxxxxx),
    // so a split never lands inside a multi-byte character.
    while (end < bytes.length && end > start && (bytes[end] & 0xc0) === 0x80) end -= 1;
    parts.push(bytes.subarray(start, end).toString("utf8"));
    start = end;
    limit = FOLD_LIMIT_OCTETS - 1; // continuation lines reserve one octet for the leading space
  }
  return parts.join("\r\n ");
}

// TEXT value escaping (RFC 5545 §3.3.11) — backslash first, or the escapes
// added below would themselves get re-escaped.
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatDateOnly(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

function formatUtcInstant(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// An end time with no explicit end time is given a one-hour duration —
// computed on the absolute instant, not by adding "1" to the wall-clock
// hour, so a start at 23:30 correctly rolls into the next calendar day
// rather than wrapping to 24:30.
const DEFAULT_DURATION_MS = 60 * 60 * 1000;

export function buildIcs(event: CalendarEvent, now: Date = new Date()): string {
  const host = new URL(siteUrl()).hostname;
  const uid = `${event.id}@${host}`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Enactus Mannheim e.V.//Kalender//DE",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatUtcInstant(now)}`,
  ];

  if (event.startTime) {
    const startInstant = wallClockToInstant(`${event.startDate}T${event.startTime}`, SITE_TIMEZONE);
    const endInstant = event.endTime
      ? wallClockToInstant(`${event.endDate ?? event.startDate}T${event.endTime}`, SITE_TIMEZONE)
      : new Date(startInstant.getTime() + DEFAULT_DURATION_MS);
    lines.push(`DTSTART:${formatUtcInstant(startInstant)}`);
    lines.push(`DTEND:${formatUtcInstant(endInstant)}`);
  } else {
    // All-day (and multi-day) event. DTEND is exclusive per RFC 5545
    // §3.6.1, so a one-day event spanning only "today" still needs
    // "tomorrow" as its DTEND, and a multi-day event's last calendar day
    // gets pushed one further.
    lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(event.startDate)}`);
    const lastDay = event.endDate ?? event.startDate;
    lines.push(`DTEND;VALUE=DATE:${formatDateOnly(addDays(lastDay, 1))}`);
  }

  lines.push(`SUMMARY:${escapeText(event.title)}`);
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}

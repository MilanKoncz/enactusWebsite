import { RECRUITING_TIMEZONE } from "@/content/recruiting";

/**
 * Converts between the wall-clock time a board member types into the admin
 * form ("2026-09-01T00:00") and the absolute instant stored in
 * recruiting_windows.
 *
 * Done server-side against RECRUITING_TIMEZONE rather than letting the
 * browser parse a `datetime-local` value as local time, which is the easy
 * version and is wrong in a way nobody would notice: it silently uses the
 * *editor's* OS timezone, so the same form filled in from abroad would
 * shift the window that gates applications by hours. content/recruiting.ts
 * declares one timezone as the source of truth; this honours it regardless
 * of where the admin happens to be sitting.
 *
 * Germany's offset changes between +01:00 and +02:00, so the offset can't
 * be a constant — it's read from the zone itself at the relevant instant.
 */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const asIfUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  return asIfUtc - instant.getTime();
}

export const WALL_CLOCK_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// Two passes, not one: the offset depends on the instant, and the instant
// depends on the offset. The first pass guesses using the offset at the
// naive-UTC reading of the same wall clock, the second corrects it — which
// resolves every case except a wall clock inside the hour that DST skips,
// where no such instant exists and any answer is a convention.
export function wallClockToInstant(wallClock: string, timeZone: string = RECRUITING_TIMEZONE): Date {
  const [datePart, timePart] = wallClock.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const naive = Date.UTC(year, month - 1, day, hour, minute);

  let instant = naive;
  for (let pass = 0; pass < 2; pass += 1) {
    instant = naive - zoneOffsetMs(new Date(instant), timeZone);
  }
  return new Date(instant);
}

// The inverse, for pre-filling the edit form: the same instant expressed as
// the wall clock a board member would recognise.
export function instantToWallClock(instant: Date, timeZone: string = RECRUITING_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`;
}

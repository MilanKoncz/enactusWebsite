import { z } from "zod";
import { calendarCategorySchema } from "@/content/calendar";

/**
 * What /admin/termine's form submits, validated identically on the client
 * and in the route — same arrangement as recruitingWindowFormSchema.ts.
 *
 * Dates and times are compared as plain strings, not converted to
 * instants: calendar_events stores date/time with no timezone (see
 * migrations/0006_calendar_events.sql's comment on why), so "2026-09-16" >
 * "2026-09-15" and "17:00" > "09:00" already compare correctly as text —
 * unlike recruitingWindowFormSchema.ts, there's no DST boundary here to
 * cross.
 */
const TIME_FORMAT = /^\d{2}:\d{2}$/;

// An empty input on an optional field arrives as "" from a plain <input>,
// not as undefined — treated as "not provided" here so the route can store
// null rather than an empty string, and so .optional() below actually
// takes effect instead of failing a .max() on an empty string that would
// otherwise pass anyway.
function optionalTrimmedString(max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );
}

function optionalDate() {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.iso.date().optional(),
  );
}

function optionalTime() {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().regex(TIME_FORMAT, "must look like 14:30").optional(),
  );
}

// Same "" -> undefined -> null-in-the-DB arrangement as the other optional
// fields above. startsWith("/") matches content/calendar.ts's schema and
// content/navigation.ts's hrefSchema — a path on this site, not an external
// URL (an external link belongs in the event's description text, not here).
function optionalInternalLink() {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().startsWith("/").max(200).optional(),
  );
}

export const calendarEventFormSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    titleEn: optionalTrimmedString(200),
    category: calendarCategorySchema,
    startDate: z.iso.date(),
    endDate: optionalDate(),
    startTime: optionalTime(),
    endTime: optionalTime(),
    location: optionalTrimmedString(200),
    description: optionalTrimmedString(600),
    descriptionEn: optionalTrimmedString(600),
    tentative: z.boolean(),
    internalLink: optionalInternalLink(),
  })
  .refine((event) => event.endDate === undefined || event.endDate >= event.startDate, {
    message: "end date must not be before the start date",
    path: ["endDate"],
  })
  .refine((event) => event.endTime === undefined || event.startTime !== undefined, {
    message: "an end time needs a start time",
    path: ["endTime"],
  })
  // "End after start" only has to hold same-day — once endDate is a later
  // calendar day than startDate, any endTime is valid (see the migration's
  // matching check constraint for why).
  .refine(
    (event) => {
      if (event.endTime === undefined || event.startTime === undefined) return true;
      const spansMultipleDays = event.endDate !== undefined && event.endDate > event.startDate;
      return spansMultipleDays || event.endTime > event.startTime;
    },
    { message: "end time must be after the start time", path: ["endTime"] },
  );

export type CalendarEventFormValues = z.infer<typeof calendarEventFormSchema>;

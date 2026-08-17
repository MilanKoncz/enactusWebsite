import { z } from "zod";

/**
 * The type and validation rules for one calendar event (Termin) — the data
 * itself lives in the `calendar_events` table
 * (migrations/0006_calendar_events.sql, lib/db.ts), managed by the board at
 * /admin/termine, not as a hardcoded array here. Same arrangement as
 * content/recruiting.ts for the application windows, for the same reason: a
 * board with yearly turnover needs to add or move a date without a code
 * change and a deploy.
 *
 * Seven categories, fixed order — this order is what the filter chips and
 * the admin category picker iterate in, and it mirrors the database's own
 * check constraint (calendar_events_category_check). Keep the two in sync;
 * a category added here without a matching migration fails at insert time,
 * not silently.
 */
export const CALENDAR_CATEGORIES = [
  "innolab",
  "projekte",
  "journeys",
  "wettkaempfe",
  "socials",
  "workshops",
  "bewerbung",
] as const;

export const calendarCategorySchema = z.enum(CALENDAR_CATEGORIES);
export type CalendarCategory = z.infer<typeof calendarCategorySchema>;

const TIME_FORMAT = /^\d{2}:\d{2}$/;

/**
 * The stored/public shape: dates and times as plain strings (no timezone —
 * see the migration's comment on why this is date/time, not timestamptz).
 * `end_time > start_time` is checked in lib/calendarEventFormSchema.ts, not
 * here, the same split content/recruiting.ts and
 * lib/recruitingWindowFormSchema.ts use: that comparison needs to account
 * for a multi-day event (end_date later than start_date), which this
 * per-row schema has no reason to know how to do twice.
 */
export const calendarEventSchema = z
  .object({
    id: z.guid(),
    title: z.string().min(1),
    titleEn: z.string().min(1).nullable(),
    category: calendarCategorySchema,
    startDate: z.iso.date(),
    endDate: z.iso.date().nullable(),
    startTime: z.string().regex(TIME_FORMAT, "must look like 14:30").nullable(),
    endTime: z.string().regex(TIME_FORMAT, "must look like 14:30").nullable(),
    location: z.string().min(1).nullable(),
    description: z.string().min(1).nullable(),
    descriptionEn: z.string().min(1).nullable(),
    tentative: z.boolean(),
  })
  .refine((event) => event.endDate === null || event.endDate >= event.startDate, {
    message: "end date must not be before the start date",
    path: ["endDate"],
  });
export type CalendarEvent = z.infer<typeof calendarEventSchema>;

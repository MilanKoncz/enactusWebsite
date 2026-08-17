import { z } from "zod";
import { SITE_TIMEZONE } from "@/content/timezone";

/**
 * The shape of an application window (Bewerbungsfenster) — the type and
 * validation rules only. The windows themselves live in the
 * `recruiting_windows` table (migrations/0003_recruiting_windows.sql,
 * lib/db.ts), managed by the board at /admin/bewerbungsfenster, not as a
 * hardcoded array here: a board with yearly turnover needs to add a cycle
 * without a code change and a deploy. This file stays the one place both
 * the admin form and the public site's open/closed logic
 * (lib/recruitingStatus.ts) get their type from, so they can't drift.
 *
 * Stored as full ISO datetimes with an explicit UTC offset (CEST, +02:00 —
 * daylight saving is still in effect for all of September) rather than bare
 * dates, since a window's exact minute matters for the open/closed decision
 * `lib/recruitingStatus.ts` compares against "now". `RECRUITING_TIMEZONE` is
 * the single source of truth for display/formatting — never hardcode
 * "Europe/Berlin" or the offset elsewhere.
 */

// Re-exported from content/timezone.ts, which now holds the actual value —
// see that file's comment. Kept as a named re-export, not a second constant,
// so every existing import of RECRUITING_TIMEZONE keeps working unchanged.
export const RECRUITING_TIMEZONE = SITE_TIMEZONE;

// Mirrors the database's own check constraint (recruiting_windows_semester_format)
// — HWS/FSS plus a two-digit year, e.g. "HWS26" or "FSS27".
const SEMESTER_FORMAT = /^(HWS|FSS)\d{2}$/;

const recruitingWindowSchema = z
  .object({
    semester: z.string().regex(SEMESTER_FORMAT, "must look like HWS26 or FSS27"),
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
  })
  .refine((window) => window.end > window.start, {
    message: "end must be after start",
    path: ["end"],
  });
export type RecruitingWindow = z.infer<typeof recruitingWindowSchema>;

export { recruitingWindowSchema, SEMESTER_FORMAT };

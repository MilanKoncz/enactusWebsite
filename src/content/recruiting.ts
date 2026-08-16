import { z } from "zod";

/**
 * The application windows (Bewerbungsfenster) that gate /mitmachen between
 * the open form and the closed-state countdown + reminder signup
 * (docs/engineering.md), and label every application with the recruiting
 * cycle it belongs to (lib/recruitingSemester.ts). A list rather than a
 * single window, because a second cycle was always expected eventually
 * (see the earlier ASSETS-TODO.md entry this replaces) — the board now
 * states each window's semester label up front instead of it being
 * inferred later.
 *
 * Stored as full ISO datetimes with an explicit UTC offset (CEST, +02:00 —
 * daylight saving is still in effect for all of September) rather than bare
 * dates, since a window's exact minute matters for the open/closed decision
 * `lib/recruitingStatus.ts` compares against "now". `RECRUITING_TIMEZONE` is
 * the single source of truth for display/formatting — never hardcode
 * "Europe/Berlin" or the offset elsewhere.
 */

export const RECRUITING_TIMEZONE = "Europe/Berlin";

const recruitingWindowSchema = z
  .object({
    semester: z.string().min(1),
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
  })
  .refine((window) => window.end > window.start, {
    message: "end must be after start",
    path: ["end"],
  });
export type RecruitingWindow = z.infer<typeof recruitingWindowSchema>;

// Confirmed by the board 2026-08-15: 2026-09-01 00:00 to 2026-09-13 23:59,
// Europe/Berlin, labelled HWS26. Add the next cycle here once the board
// confirms it — never invent one (see ASSETS-TODO.md).
export const recruitingWindows: RecruitingWindow[] = [
  { semester: "HWS26", start: "2026-09-01T00:00:00+02:00", end: "2026-09-13T23:59:00+02:00" },
].map((window) => recruitingWindowSchema.parse(window));

export { recruitingWindowSchema };

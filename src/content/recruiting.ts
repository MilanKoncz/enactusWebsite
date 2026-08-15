import { z } from "zod";

/**
 * The application window (Bewerbungsfenster) that gates /mitmachen between
 * the open form and the closed-state countdown + reminder signup
 * (docs/engineering.md). Confirmed by the board 2026-08-15: 2026-09-01 00:00
 * to 2026-09-13 23:59, Europe/Berlin. Stored as full ISO datetimes with an
 * explicit UTC offset (CEST, +02:00 — daylight saving is still in effect for
 * all of September) rather than bare dates, since the window's exact minute
 * matters for the open/closed decision `lib/` compares against "now". The
 * `timezone` field is the source of truth for display/formatting — never
 * hardcode "Europe/Berlin" or the offset elsewhere.
 */

const recruitingWindowSchema = z
  .object({
    opensAt: z.iso.datetime({ offset: true }).nullable(),
    closesAt: z.iso.datetime({ offset: true }).nullable(),
    timezone: z.string(),
  })
  .refine((window) => !(window.opensAt && window.closesAt) || window.closesAt > window.opensAt, {
    message: "closesAt must be after opensAt",
    path: ["closesAt"],
  });
export type RecruitingWindow = z.infer<typeof recruitingWindowSchema>;

export const recruitingWindow: RecruitingWindow = recruitingWindowSchema.parse({
  opensAt: "2026-09-01T00:00:00+02:00",
  closesAt: "2026-09-13T23:59:00+02:00",
  timezone: "Europe/Berlin",
});

export { recruitingWindowSchema };

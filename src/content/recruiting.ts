import { z } from "zod";

/**
 * The application window (Bewerbungsfenster) that gates /mitmachen between
 * the open form and the closed-state countdown + reminder signup
 * (docs/engineering.md). Dates are null until the board sets the next
 * window — the open/closed decision must never be guessed, so the page's
 * open/closed logic (comparing against "now") lives in lib/, not here.
 */

const recruitingWindowSchema = z
  .object({
    opensAt: z.iso.date().nullable(),
    closesAt: z.iso.date().nullable(),
  })
  .refine((window) => !(window.opensAt && window.closesAt) || window.closesAt > window.opensAt, {
    message: "closesAt must be after opensAt",
    path: ["closesAt"],
  });
export type RecruitingWindow = z.infer<typeof recruitingWindowSchema>;

export const recruitingWindow: RecruitingWindow = recruitingWindowSchema.parse({
  opensAt: null,
  closesAt: null,
});

export { recruitingWindowSchema };

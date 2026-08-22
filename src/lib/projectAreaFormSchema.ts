import { z } from "zod";

/**
 * What /admin/wunschbereiche's form submits, validated identically on the
 * client and in the route — same arrangement as calendarEventFormSchema.ts.
 *
 * max(120) on both labels matches applicationFormSchema.ts's own per-item
 * limit on `desiredAreas` (z.string().max(120)) exactly: a label longer
 * than that could never actually be submitted back through the public
 * form, so allowing one here would just be a silent trap.
 */
export const projectAreaFormSchema = z.object({
  labelDe: z.string().trim().min(1).max(120),
  labelEn: z.string().trim().min(1).max(120),
  sortOrder: z.coerce.number().int(),
  active: z.boolean(),
});

export type ProjectAreaFormInput = z.input<typeof projectAreaFormSchema>;
export type ProjectAreaFormValues = z.output<typeof projectAreaFormSchema>;

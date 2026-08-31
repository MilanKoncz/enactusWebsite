import { z } from "zod";

/**
 * What /admin/ressorts's form submits, validated identically on the client
 * and in the route — same arrangement as projectAreaFormSchema.ts, since
 * departments follow the exact same admin lifecycle (create, rename,
 * reorder, activate/deactivate, delete).
 *
 * max(120) on both labels matches applicationFormSchema.ts's own per-item
 * limit on `departments` exactly: a label longer than that could never
 * actually be submitted back through the public form, so allowing one here
 * would just be a silent trap.
 */
export const departmentFormSchema = z.object({
  labelDe: z.string().trim().min(1).max(120),
  labelEn: z.string().trim().min(1).max(120),
  sortOrder: z.coerce.number().int(),
  active: z.boolean(),
});

export type DepartmentFormInput = z.input<typeof departmentFormSchema>;
export type DepartmentFormValues = z.output<typeof departmentFormSchema>;

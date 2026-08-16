import { z } from "zod";

/**
 * The benefits grid on the homepage ("was ihr lernt und bekommt"). Reduced
 * from six generic placeholder slots to these four board-confirmed benefits
 * 2026-08-16 — semantic keys, not "benefit-1".."benefit-4", now that the
 * content itself is real rather than a placeholder (same reasoning as
 * content/pillars.ts's "esg"/"execution"/"network"). The key is a Zod enum,
 * not a free string, so that `t(\`${benefit.key}.title\`)` in components
 * stays statically checked against messages/{locale}.json (the same
 * reasoning as content/stars.ts). `title`, `lead`, and `detail` are copy and
 * live in messages/{locale}.json under "Benefits.<key>"; this file only
 * holds the key and display order.
 */

const benefitKeySchema = z.enum(["responsibility", "teamwork", "alumniAdvisors", "community"]);
export type BenefitKey = z.infer<typeof benefitKeySchema>;

const benefitSchema = z.object({
  key: benefitKeySchema,
  order: z.number().int().min(1),
});
export type Benefit = z.infer<typeof benefitSchema>;

function benefit(key: BenefitKey, order: number): Benefit {
  return benefitSchema.parse({ key, order });
}

export const benefits: Benefit[] = benefitKeySchema.options.map((key, index) =>
  benefit(key, index + 1),
);

export { benefitSchema, benefitKeySchema };

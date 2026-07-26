import { z } from "zod";

/**
 * The benefits grid on the homepage ("was man lernt und bekommt"). The exact
 * six benefits aren't confirmed with the board yet, so the key enum holds
 * generic placeholder slots rather than asserting specific claims — confirm
 * the real benefits with the board before renaming them (see
 * ASSETS-TODO.md). The key is a Zod enum, not a free string, so that
 * `t(\`${benefit.key}.title\`)` in components stays statically checked
 * against messages/{locale}.json (the same reasoning as content/stars.ts).
 * `title` and `detail` are copy and live in messages/{locale}.json under
 * "Benefits.<key>"; this file only holds the key and display order.
 */

const benefitKeySchema = z.enum([
  "benefit-1",
  "benefit-2",
  "benefit-3",
  "benefit-4",
  "benefit-5",
  "benefit-6",
]);
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

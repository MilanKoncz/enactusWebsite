import { z } from "zod";

/**
 * The three pillars of "Was uns einzigartig macht" on the homepage: ESG
 * character, risk-free execution, and the international network. This is a
 * fixed, confirmed set of three (unlike board/alumni/partners, which wait on
 * real data) — the key enum, not a free string, so `t(\`${pillar.key}.title\`)`
 * in components stays statically checked against messages/{locale}.json (the
 * same reasoning as content/stars.ts). `title`, `lead`, and `detail` are copy
 * and live in messages/{locale}.json under "Pillars.<key>"; this file only
 * holds the key and display order.
 */

const pillarKeySchema = z.enum(["esg", "execution", "network"]);
export type PillarKey = z.infer<typeof pillarKeySchema>;

const pillarSchema = z.object({
  key: pillarKeySchema,
  order: z.number().int().min(1),
});
export type Pillar = z.infer<typeof pillarSchema>;

function pillar(key: PillarKey, order: number): Pillar {
  return pillarSchema.parse({ key, order });
}

export const pillars: Pillar[] = pillarKeySchema.options.map((key, index) =>
  pillar(key, index + 1),
);

export { pillarSchema, pillarKeySchema };

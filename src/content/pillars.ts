import { z } from "zod";

/**
 * The three pillars of "Was uns einzigartig macht" on the homepage: ESG
 * character, risk-free execution, and the international network. This is a
 * fixed, confirmed set of three (unlike board/alumni/partners, which wait on
 * real data) — the key enum, not a free string, so `t(\`${pillar.key}.title\`)`
 * in components stays statically checked against messages/{locale}.json (the
 * same reasoning as content/stars.ts). `title`, `lead`, and `detail` are copy
 * and live in messages/{locale}.json under "Pillars.<key>"; this file only
 * holds the key, display order, and now a background photo per pillar.
 *
 * Images added 2026-08-16 from the board's own media handover (`neue
 * medien/`), matched to the pillar they actually illustrate rather than by
 * filename order: `esg` gets the official UN SDG wheel (the pillar's whole
 * subject is the Sustainable Development Goals); `execution` gets a photo of
 * a real shipped product (ReSoil, a former project) standing in for
 * "founding a real company, risk-free"; `network` gets a photo from an
 * Enactus Germany National Cup, the national competition network this
 * pillar is actually about.
 */

const pillarKeySchema = z.enum(["esg", "execution", "network"]);
export type PillarKey = z.infer<typeof pillarKeySchema>;

const pillarSchema = z.object({
  key: pillarKeySchema,
  order: z.number().int().min(1),
  image: z.string().nullable(),
});
export type Pillar = z.infer<typeof pillarSchema>;

function pillar(key: PillarKey, order: number, image: string): Pillar {
  return pillarSchema.parse({ key, order, image });
}

const PILLAR_IMAGES: Record<PillarKey, string> = {
  esg: "/brand/pillars/esg.webp",
  execution: "/brand/pillars/execution.webp",
  network: "/brand/pillars/network.webp",
};

export const pillars: Pillar[] = pillarKeySchema.options.map((key, index) =>
  pillar(key, index + 1, PILLAR_IMAGES[key]),
);

export { pillarSchema, pillarKeySchema };

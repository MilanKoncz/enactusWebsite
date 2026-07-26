import { z } from "zod";

/**
 * Network-scale figures for Enactus Germany and Enactus Global — not this
 * club's own numbers (those are kpis.ts), so they're verified: true from
 * the start rather than pending a board handover.
 * Source: Enactus Germany and Enactus Global published network figures, as
 * given by the board 2026-07-26. Re-confirm against enactus.de / enactus.org
 * before reuse if this file goes untouched for a long time — network-wide
 * figures change as the network grows.
 */

const networkStatsSchema = z.object({
  studentsGermany: z.number().int().positive(),
  universitiesGermany: z.number().int().positive(),
  countriesGlobal: z.number().int().positive(),
  studentsGlobal: z.number().int().positive(),
  verified: z.boolean(),
  asOf: z.iso.date(),
});
export type NetworkStats = z.infer<typeof networkStatsSchema>;

export const networkStats: NetworkStats = networkStatsSchema.parse({
  studentsGermany: 1700,
  universitiesGermany: 30,
  countriesGlobal: 34,
  studentsGlobal: 42000,
  verified: true,
  asOf: "2026-07-26",
});

export { networkStatsSchema };

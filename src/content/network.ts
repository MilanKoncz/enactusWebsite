import { z } from "zod";

/**
 * Network-scale figures for Enactus Germany and Enactus Global — not this
 * club's own numbers (those are kpis.ts). Source: enactus.de/network,
 * confirmed by the board 2026-08-15. Re-confirm against enactus.de before
 * reuse if this file goes untouched for a long time — network-wide figures
 * change as the network grows.
 *
 * Deliberately no global student count. enactus.de/network and other
 * published sources disagree with each other by tens of thousands (figures
 * seen range from ~42,000 to ~70,500), so no number is trustworthy enough to
 * publish. Do not resurrect the old website's figures (2,000 members / 35
 * teams / 70,000 globally) either — those were never reconciled with this
 * source and are not confirmed to mean the same thing.
 */

const networkStatsSchema = z.object({
  // "rund 1.700" — approximate by the source's own wording, not a precise count.
  studentsGermany: z.number().int().positive(),
  // "über 30" — a floor, not an exact count.
  universitiesGermany: z.number().int().positive(),
  countriesGlobal: z.number().int().positive(),
  verified: z.boolean(),
  asOf: z.iso.date(),
});
export type NetworkStats = z.infer<typeof networkStatsSchema>;

export const networkStats: NetworkStats = networkStatsSchema.parse({
  studentsGermany: 1700,
  universitiesGermany: 30,
  countriesGlobal: 34,
  verified: true,
  asOf: "2026-08-15",
});

/**
 * Sibling Enactus teams linked from /events, alongside this stats block —
 * the brief named five: München, Münster, Hamburg, Köln, Karlsruhe. Every
 * URL below was fetched and confirmed live on 2026-08-15, each page
 * self-identifying as that city's Enactus chapter — not guessed from a
 * domain-naming pattern. None needed a placeholder.
 *
 * These same five, plus Mannheim itself, are the six locations plotted on
 * the Germany map at the end of /events (GermanyMap.tsx). Checked
 * 2026-08-19 whether enactus.de publishes a fuller, official roster of
 * German team locations to plot instead: enactus.de/network references a
 * "list of all Enactus teams in Germany" heading, but the roster itself
 * renders as content this project's fetch tooling couldn't read (likely
 * client-rendered or embedded, not present in the fetched markup) — not
 * confirmed empty, just not retrievable, so nothing beyond these six was
 * added rather than guessing at what that list contains. The map's pixel
 * coordinates for each city live in GermanyMap.tsx itself, not here —
 * presentation detail, not a board-maintained fact.
 */
const teamKeySchema = z.enum(["muenchen", "muenster", "hamburg", "koeln", "karlsruhe"]);
export type TeamKey = z.infer<typeof teamKeySchema>;

const teamLinkSchema = z.object({
  key: teamKeySchema,
  name: z.string(),
  url: z.url().nullable(),
});
export type TeamLink = z.infer<typeof teamLinkSchema>;

function teamLink(key: TeamKey, name: string, url: string): TeamLink {
  return teamLinkSchema.parse({ key, name, url });
}

export const teamLinks: TeamLink[] = [
  teamLink("muenchen", "München", "https://enactus-muenchen.de/"),
  teamLink("muenster", "Münster", "https://enactus-muenster.de/"),
  teamLink("hamburg", "Hamburg", "https://enactus-hh.de/"),
  teamLink("koeln", "Köln", "https://enactus-koeln.de/"),
  teamLink("karlsruhe", "Karlsruhe", "https://enactus-karlsruhe.de/"),
];

export { networkStatsSchema, teamLinkSchema, teamKeySchema };

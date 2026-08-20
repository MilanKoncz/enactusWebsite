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
  // Re-confirmed 2026-08-20 against enactus.de/network's own team roster
  // (see germanTeamCities below for how) — that roster names 24 German
  // locations today, not the "über 30" figure this field held before. The
  // same page's prose separately claims "28 Hochschulen", a number with no
  // enumerable location behind it (see germanTeamCities' comment) — 24 is
  // what could actually be counted, named, and plotted, so 24 is published.
  universitiesGermany: 24,
  countriesGlobal: 34,
  verified: true,
  asOf: "2026-08-20",
});

/**
 * Sibling Enactus teams linked from /events as their own text-link cards
 * above the map, alongside this stats block — the brief named five:
 * München, Münster, Hamburg, Köln, Karlsruhe. Every URL below was fetched
 * and confirmed live on 2026-08-15, each page self-identifying as that
 * city's Enactus chapter — not guessed from a domain-naming pattern. None
 * needed a placeholder. These same five also appear in germanTeamCities
 * below (the map's full roster) — two lists sharing five entries on
 * purpose, since the card grid and the map are separate UI surfaces with
 * different jobs, not two views of one dataset.
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

/**
 * Every German Enactus team location except Mannheim itself (which has its
 * own always-labelled, unlinked point — GermanyMap.tsx) — the map's full
 * 23-point roster, each one now a real link (board feedback, 2026-08-20:
 * "link every team's website", not just these five).
 *
 * Source: enactus.de/network's "Liste aller Enactus Teams in Deutschland"
 * accordion, both the city names and their per-team URLs. That section has
 * no server-side-rendered text in a plain fetch of the collapsed page, and
 * cms.enactus-germany.foldland.services' root redirects straight to its
 * Strapi admin login rather than exposing a queryable API — but the roster
 * turned out not to need either route: the accordion's content, links
 * included, is server-rendered React (a Next.js "flight" RSC payload
 * embedded in the page's own <script> tags), present in the HTML on a
 * plain fetch whether or not the accordion has ever been opened by a
 * browser. Retrieved 2026-08-20 by fetching that HTML directly and reading
 * both the list and each team's linked URL out of that payload — no
 * headless browser needed, no CMS credentials involved.
 *
 * That payload names 24 German locations in total (Mannheim included) —
 * not the "28 Hochschulen" the same page's prose states a few sentences
 * earlier. The two figures are the source's own inconsistency, not a
 * transcription error here: the prose number has no matching 25th–28th
 * entry to point at anywhere in the payload, so only the 24 that are
 * actually enumerable, nameable, and plottable are counted and published
 * (networkStats.universitiesGermany above). If enactus.de/network ever
 * reconciles the two figures, re-check this list rather than assuming "28"
 * is simply "these 24 plus four more".
 *
 * Every URL below was opened and confirmed live on 2026-08-20 — the same
 * per-URL verification content-guide.md asks for on partner links — except
 * `straubing`, whose enactus.de-listed URL (still their current one as of
 * this retrieval) 404s on its own hosting platform; url is null there and
 * the gap is logged in ASSETS-TODO.md rather than linking a dead page.
 * Five of these (muenchen/muenster/hamburg/koeln/karlsruhe) are the same
 * five teamLinks above names — this list's hamburg keeps teamLinks' own
 * enactus-hh.de rather than the LinkedIn page enactus.de/network links
 * instead, since a dedicated site beats a LinkedIn redirect when both
 * exist and enactus-hh.de was independently confirmed live the same day.
 *
 * Coordinates are each city's public, well-known center point (decimal
 * degrees) — geographic fact, not presentation, so it lives here rather
 * than in GermanyMap.tsx, the same split MANNHEIM_POINT's own comment
 * there documents. GermanyMap.tsx runs each pair through the identical
 * geoConicEqualArea projection MANNHEIM_POINT uses to place its dot,
 * fitted against that point's and these five confirmed teams' known pixel
 * positions rather than re-deriving fitExtent's bounds — see that file's
 * comment for the method.
 */
const germanTeamCitySchema = z.object({
  key: z.string(),
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
  url: z.url().nullable(),
});
export type GermanTeamCity = z.infer<typeof germanTeamCitySchema>;

function city(key: string, name: string, lat: number, lon: number, url: string | null): GermanTeamCity {
  return germanTeamCitySchema.parse({ key, name, lat, lon, url });
}

export const germanTeamCities: GermanTeamCity[] = [
  city("aachen", "Aachen", 50.7753, 6.0839, "https://www.enactusaachen.de/"),
  city("augsburg", "Augsburg", 48.3705, 10.8978, "https://enactus-augsburg.de/"),
  city("bayreuth", "Bayreuth", 49.9456, 11.5713, "https://enactus-bayreuth.de/"),
  city("berlin", "Berlin", 52.52, 13.405, "https://www.enactus-berlin.de/"),
  city("bochum", "Bochum", 51.4818, 7.2162, "https://enactus-bochum.de"),
  city("bonn", "Bonn", 50.7374, 7.0982, "https://www.bonn.enactus.team/"),
  city("braunschweig", "Braunschweig", 52.2689, 10.5268, "https://enactus-braunschweig.de"),
  city("duesseldorf", "Düsseldorf", 51.2277, 6.7735, "https://www.enactus-duesseldorf.de"),
  city("frankfurt", "Frankfurt am Main", 50.1109, 8.6821, "https://enactus-frankfurt.de"),
  city("goettingen", "Göttingen", 51.5413, 9.9158, "https://www.linkedin.com/company/enactus-g%C3%B6ttingen-e-v"),
  city("hamburg", "Hamburg", 53.5511, 9.9937, "https://enactus-hh.de/"),
  city("hannover", "Hannover", 52.3759, 9.732, "https://enactus-hannover.de/"),
  city("ingolstadt", "Ingolstadt", 48.7665, 11.4257, "https://enactus-ingolstadt.de/"),
  city("karlsruhe", "Karlsruhe", 49.0069, 8.4037, "https://enactus-karlsruhe.de/"),
  city("kiel", "Kiel", 54.3233, 10.1228, "https://de.linkedin.com/company/enactus-kiel"),
  city("koeln", "Köln", 50.9375, 6.9603, "https://enactus-koeln.de/"),
  city("lueneburg", "Lüneburg", 53.2373, 10.4114, "https://enactus-lüneburg.de"),
  city("magdeburg", "Magdeburg", 52.1205, 11.6276, "https://enactus-magdeburg.de/"),
  city("mainz", "Mainz", 49.9929, 8.2473, "https://enactus-mainz.de/"),
  city("muenchen", "München", 48.1351, 11.582, "https://enactus-muenchen.de/"),
  city("muenster", "Münster", 51.9607, 7.6261, "https://enactus-muenster.de/"),
  city("straubing", "Straubing", 48.8811, 12.5747, null),
  city("stuttgart", "Stuttgart", 48.7758, 9.1829, "https://de.linkedin.com/company/enactus-stuttgart"),
];

export { networkStatsSchema, teamLinkSchema, teamKeySchema, germanTeamCitySchema };

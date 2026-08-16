import { z } from "zod";

/**
 * The five headline numbers used on the homepage and about page,
 * board-confirmed 2026-08-15, reordered and re-picked 2026-08-16 per board
 * feedback on the homepage revamp (see ASSETS-TODO.md). `funding` and
 * `projectIterations` are lower bounds ("mehr als") rather than exact counts
 * — HomeKpis.tsx renders those two with a leading ">" — and `worldRanking`
 * is a rank ("Top N"), rendered with that prefix instead; this file only
 * ever holds the raw numbers, never formatted text. `2× World-Cup-Finale`
 * (the previous `worldCupFinals` entry) was dropped in the same pass,
 * replaced by the team's world ranking. The founding year lives in the
 * footer instead ("seit {year}", content/org.ts, Footer.tsx) since a
 * one-off fact reads oddly next to five genuine headline stats.
 *
 * A per-KPI `asOf` date used to live here and render as a "Stand: {date}"
 * line on the homepage; board feedback removed that line from the page
 * entirely. Board-confirmed as of 2026-08-15 for the four repeated figures,
 * and 2026-08-16 for `worldRanking` — kept here only as this comment now,
 * not as a rendered or schema-validated field.
 */

const kpiKeySchema = z.enum([
  "projectIterations",
  "funding",
  "nationalChampionships",
  "worldRanking",
  "spinoffs",
]);
export type KpiKey = z.infer<typeof kpiKeySchema>;

const kpiSchema = z.object({
  key: kpiKeySchema,
  value: z.number(),
  verified: z.boolean(),
});
export type Kpi = z.infer<typeof kpiSchema>;

function kpi(input: z.input<typeof kpiSchema>): Kpi {
  return kpiSchema.parse(input);
}

export const kpis: Kpi[] = [
  // ">65" — see the file comment on the ">" formatting.
  kpi({ key: "projectIterations", value: 65, verified: true }),
  // ">150.000 €" — see the file comment.
  kpi({ key: "funding", value: 150_000, verified: true }),
  kpi({ key: "nationalChampionships", value: 8, verified: true }),
  // "Top 16 weltweit (von über 1.000 Teams)" — the 1,000+ figure is the
  // field size the rank was measured against, rendered as HomeKpis.tsx's
  // reserved per-figure detail line (Kpis.labels.worldRanking / .detail),
  // not a separate KPI of its own.
  kpi({ key: "worldRanking", value: 16, verified: true }),
  // "5 Gegründet & Übergeben": named and evidenced (Blauherz, Differgy,
  // Sanagua, Stadthonig, Sunte). The board's internal working number is 9 —
  // see ASSETS-TODO.md for why this KPI stays at 5 until the other four are named.
  kpi({ key: "spinoffs", value: 5, verified: true }),
];

export { kpiSchema, kpiKeySchema };

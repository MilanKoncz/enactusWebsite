import { z } from "zod";

/**
 * The five headline numbers used on the homepage and about page, confirmed
 * by the board 2026-08-15 (see ASSETS-TODO.md). `funding` and
 * `projectIterations` are lower bounds ("mehr als") rather than exact counts
 * — HomeKpis.tsx renders those two with a leading ">" and `worldCupFinals`
 * with a trailing "×", so this file only ever holds the raw number, never
 * formatted text. The founding year used to live here too; it now shows
 * "seit {year}" in the footer instead (content/org.ts, Footer.tsx) since a
 * one-off fact reads oddly next to four genuine headline stats.
 */

const kpiKeySchema = z.enum([
  "nationalChampionships",
  "worldCupFinals",
  "spinoffs",
  "funding",
  "projectIterations",
]);
export type KpiKey = z.infer<typeof kpiKeySchema>;

const kpiSchema = z.object({
  key: kpiKeySchema,
  value: z.number(),
  verified: z.boolean(),
  asOf: z.iso.date(),
});
export type Kpi = z.infer<typeof kpiSchema>;

function kpi(input: z.input<typeof kpiSchema>): Kpi {
  return kpiSchema.parse(input);
}

export const kpis: Kpi[] = [
  kpi({ key: "nationalChampionships", value: 8, verified: true, asOf: "2026-08-15" }),
  kpi({ key: "worldCupFinals", value: 2, verified: true, asOf: "2026-08-15" }),
  // "5 Gegründet & Übergeben": named and evidenced (Blauherz, Differgy,
  // Sanagua, Stadthonig, Sunte). The board's internal working number is 9 —
  // see ASSETS-TODO.md for why this KPI stays at 5 until the other four are named.
  kpi({ key: "spinoffs", value: 5, verified: true, asOf: "2026-08-15" }),
  // ">150.000 €" — see the file comment on the ">" formatting.
  kpi({ key: "funding", value: 150_000, verified: true, asOf: "2026-08-15" }),
  // ">65" — see the file comment.
  kpi({ key: "projectIterations", value: 65, verified: true, asOf: "2026-08-15" }),
];

export { kpiSchema, kpiKeySchema };

import { z } from "zod";
import { org } from "./org";

/**
 * The five headline numbers used on the homepage and about page. Every
 * entry carries verified/asOf so an unconfirmed figure can be flagged in
 * the UI instead of presented with the same confidence as a checked one —
 * all five start unverified per the board handover, see ASSETS-TODO.md.
 * Labels, units, and phrasing ("seit 2003", "8 Meistertitel") live in
 * messages/; this file holds only the key, the raw number, and provenance.
 */

const kpiKeySchema = z.enum([
  "nationalChampionships",
  "spinoffs",
  "funding",
  "projectIterations",
  "foundedYear",
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
  kpi({ key: "nationalChampionships", value: 8, verified: false, asOf: "2026-07-26" }),
  kpi({ key: "spinoffs", value: 5, verified: false, asOf: "2026-07-26" }),
  kpi({ key: "funding", value: 250_000, verified: false, asOf: "2026-07-26" }),
  kpi({ key: "projectIterations", value: 70, verified: false, asOf: "2026-07-26" }),
  // Same fact as org.foundingYear.year — read from there so the two can't disagree.
  kpi({
    key: "foundedYear",
    value: org.foundingYear.year,
    verified: org.foundingYear.verified,
    asOf: "2026-07-26",
  }),
];

export { kpiSchema, kpiKeySchema };

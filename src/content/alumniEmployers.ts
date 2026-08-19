import { z } from "zod";

/**
 * Companies our alumni work at today — a factual "where they ended up" grid
 * shown below the alumni statements (AlumniVoices.tsx), not a partnership
 * claim: no logo here links to the company's own site, and none is tied to
 * a named person (see docs/content-guide.md and the board brief, 2026-08-19).
 *
 * Source: a board media handover of 56 black-and-white logos
 * (`AlumniLogos/`, root of the repo), every file named identically and
 * generically ("Logos schwarzweiß umstellen (N).png") — the filename itself
 * carries no company name. Per board sign-off, the name was instead read
 * directly off each logo's own text where one was clearly and unambiguously
 * printed on it; two of the 56 had no legible company name at all (a bare
 * mark with no text) and are excluded here, not guessed — see
 * ASSETS-TODO.md. Logos live in `public/brand/alumni-employers/`.
 */

const alumniEmployerSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  logo: z.string(),
});
export type AlumniEmployer = z.infer<typeof alumniEmployerSchema>;

function employer(slug: string, name: string): AlumniEmployer {
  return alumniEmployerSchema.parse({ slug, name, logo: `/brand/alumni-employers/${slug}.png` });
}

export const alumniEmployers: AlumniEmployer[] = [
  employer("climentum-capital", "Climentum Capital"),
  employer("all-gravy", "all.gravy"),
  employer("ey-parthenon", "EY Parthenon"),
  employer("basf", "BASF"),
  employer("avelios-medical", "Avelios Medical"),
  employer("enpal", "Enpal"),
  employer("commerzbank", "Commerzbank"),
  employer("bcg", "BCG"),
  employer("mckinsey", "McKinsey & Company"),
  employer("creandum", "Creandum"),
  employer("deutsche-bundesbank", "Deutsche Bundesbank"),
  employer("pwc", "PwC"),
  employer("pwc-strategy", "PwC Strategy&"),
  employer("deloitte", "Deloitte"),
  employer("jasmin-capital", "Jasmin Capital"),
  employer("kpmg", "KPMG"),
  employer("hellomateo", "hellomateo"),
  employer("setero", "Setero"),
  employer("picus-capital", "Picus Capital"),
  employer("dachser", "Dachser"),
  employer("finn", "FINN"),
  employer("datev", "DATEV"),
  employer("pg", "P&G"),
  employer("luxera-energy", "Luxera Energy"),
  employer("tacto", "tacto"),
  employer("bain", "Bain & Company"),
  employer("citi", "Citi"),
  employer("redstone", "Redstone"),
  employer("porsche", "Porsche"),
  employer("archimed", "Archimed"),
  employer("bank-of-america", "Bank of America"),
  employer("mercanis", "Mercanis"),
  employer("hsbc", "HSBC"),
  employer("all-seas-capital", "All Seas Capital"),
  employer("roche", "Roche"),
  employer("mercedes-benz", "Mercedes-Benz"),
  employer("ivalua", "Ivalua"),
  employer("dhl-consulting", "DHL Consulting"),
  employer("five-degrees", "Five Degrees"),
  employer("eqt", "EQT"),
  employer("knowunity", "Knowunity"),
  employer("deutsche-bank", "Deutsche Bank"),
  employer("celonis", "Celonis"),
  employer("jp-morgan", "J.P. Morgan"),
  employer("abb", "ABB"),
  employer("berenberg", "Berenberg"),
  employer("shyftplan", "shyftplan"),
  employer("roland-berger", "Roland Berger"),
  employer("morgan-stanley", "Morgan Stanley"),
  employer("henkel", "Henkel"),
  employer("coparion", "Coparion"),
  employer("breev", "Breev"),
  employer("ewor", "EWOR"),
  employer("y-combinator", "Y Combinator"),
];

export { alumniEmployerSchema };

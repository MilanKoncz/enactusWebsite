import { z } from "zod";

/**
 * The four partner statements shown on /partner, carried over from the old
 * site (enactus-mannheim.com/partner) and shortened to read as quotes
 * rather than paragraphs — see messages/{locale}.json's
 * "PartnerStatements.<slug>.quote" for the actual (≤200 character) text,
 * shortened meaning-preserving from the originals, nothing added. `role` is
 * copy too (it names a company, which does get translated in the English
 * pass — "Partner bei Horbach" / "Partner at Horbach"); this file only
 * holds the stable identity (slug, name) and display order.
 */

const partnerStatementSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  role: z.string(),
  quote: z.string(),
});
export type PartnerStatement = z.infer<typeof partnerStatementSchema>;

function statement(slug: string, name: string): PartnerStatement {
  return partnerStatementSchema.parse({
    slug,
    name,
    role: `PartnerStatements.${slug}.role`,
    quote: `PartnerStatements.${slug}.quote`,
  });
}

export const partnerStatements: PartnerStatement[] = [
  statement("moritz-knabe", "Moritz Knabe"),
  statement("pauline-machtolf", "Pauline Machtolf"),
  statement("alexander-mueller", "Alexander Müller"),
  statement("cornelius-bossers", "Cornelius Bossers"),
];

export { partnerStatementSchema };

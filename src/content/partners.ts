import { z } from "zod";

/**
 * Corporate and network partners shown on the partner page and the homepage
 * logo band. Roster and tiers confirmed by the board 2026-08-15 (see
 * ASSETS-TODO.md), replacing the previous eight placeholder entries. `tier`
 * stays a free string rather than an enum: the three tier names below
 * (Knowledge/Flagship/Sponsoring) are this handover's wording, not a
 * guaranteed-stable structure. Logos were pulled from the old Webflow site's
 * CDN into `public/brand/partners/` — several source files were already
 * SVG, the rest are the rasters the old site itself used. `url` (each
 * partner's own website) was not part of this handover and stays null
 * rather than guessed.
 */

const partnerSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  logo: z.string().nullable(),
  url: z.url().nullable(),
  tier: z.string().nullable(),
});
export type Partner = z.infer<typeof partnerSchema>;

function partner(input: { slug: string; name: string; logo: string; tier: string }): Partner {
  return partnerSchema.parse({ ...input, url: null });
}

export const partners: Partner[] = [
  // Knowledge
  partner({ slug: "sza", name: "SZA", logo: "/brand/partners/sza.svg", tier: "Knowledge" }),
  partner({ slug: "kpmg", name: "KPMG", logo: "/brand/partners/kpmg.svg", tier: "Knowledge" }),
  partner({
    slug: "freudenberg",
    name: "Freudenberg",
    logo: "/brand/partners/freudenberg.png",
    tier: "Knowledge",
  }),
  partner({ slug: "horbach", name: "Horbach", logo: "/brand/partners/horbach.png", tier: "Knowledge" }),
  partner({
    slug: "shub-mannheim",
    name: "SHUB Mannheim",
    logo: "/brand/partners/shub-mannheim.svg",
    tier: "Knowledge",
  }),
  partner({ slug: "mafinex", name: "MAFINEX", logo: "/brand/partners/mafinex.svg", tier: "Knowledge" }),
  partner({ slug: "mcei", name: "MCEI", logo: "/brand/partners/mcei.png", tier: "Knowledge" }),
  // Flagship
  partner({
    slug: "procredit-bank",
    name: "ProCredit Bank",
    logo: "/brand/partners/procredit-bank.png",
    tier: "Flagship",
  }),
  partner({
    slug: "eon-inhouse-consulting",
    name: "E.ON Inhouse Consulting",
    logo: "/brand/partners/eon-inhouse-consulting.jpg",
    tier: "Flagship",
  }),
  // Sponsoring
  partner({
    slug: "fuchs-petrolub",
    name: "Fuchs Petrolub",
    logo: "/brand/partners/fuchs-petrolub.png",
    tier: "Sponsoring",
  }),
  partner({
    slug: "heidelberg-materials",
    name: "Heidelberg Materials",
    logo: "/brand/partners/heidelberg-materials.svg",
    tier: "Sponsoring",
  }),
  partner({
    slug: "absolventum",
    name: "Absolventum",
    logo: "/brand/partners/absolventum.png",
    tier: "Sponsoring",
  }),
];

export { partnerSchema };

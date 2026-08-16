import { z } from "zod";

/**
 * Corporate and network partners shown on the partner page and the homepage
 * logo band. Roster and tiers confirmed by the board 2026-08-15 (see
 * ASSETS-TODO.md), replacing the previous eight placeholder entries. `tier`
 * stays a free string rather than an enum: the three tier names below
 * (Knowledge/Flagship/Sponsoring) are this handover's wording, not a
 * guaranteed-stable structure. Logos were pulled from the old Webflow site's
 * CDN into `public/brand/partners/` — several source files were already
 * SVG, the rest are the rasters the old site itself used.
 *
 * `url` (each partner's own website) was fetched and confirmed 2026-08-15 —
 * see ASSETS-TODO.md for the three exceptions: `horbach` and
 * `eon-inhouse-consulting` block automated fetches (403) but were confirmed
 * live via independent search results instead; `mcei` could not be
 * confirmed at all (the domain is behind a maintenance-mode auth wall) and
 * stays null.
 *
 * Five more (`htgf`, `allianz-global-investors`, `basf`, `phoenix-group`,
 * `pg`) were added 2026-08-16 for the homepage logo band only, from the
 * board's own logo handover (`neue medien/Logo Firmen/`) — real logos, but
 * `tier`/`url` stay `null` until the board assigns a partnership tier and
 * the sites are fetched and confirmed the same way the twelve above were
 * (see ASSETS-TODO.md). A `null` tier simply never matches PartnerTiers.tsx's
 * fixed `TIER_ORDER`, so these five appear in the homepage band without
 * also showing up (unconfirmed) on /partner's tiered grid.
 */

const partnerSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  logo: z.string().nullable(),
  url: z.url().nullable(),
  tier: z.string().nullable(),
});
export type Partner = z.infer<typeof partnerSchema>;

function partner(input: {
  slug: string;
  name: string;
  logo: string;
  tier: string | null;
  url?: string;
}): Partner {
  return partnerSchema.parse({ ...input, url: input.url ?? null });
}

export const partners: Partner[] = [
  // Knowledge
  partner({ slug: "sza", name: "SZA", logo: "/brand/partners/sza.svg", tier: "Knowledge", url: "https://www.sza.de/" }),
  partner({
    slug: "kpmg",
    name: "KPMG",
    logo: "/brand/partners/kpmg.svg",
    tier: "Knowledge",
    url: "https://kpmg.com/de/de.html",
  }),
  partner({
    slug: "freudenberg",
    name: "Freudenberg",
    logo: "/brand/partners/freudenberg.png",
    tier: "Knowledge",
    url: "https://www.freudenberg.com/",
  }),
  partner({
    slug: "horbach",
    name: "Horbach",
    logo: "/brand/partners/horbach.png",
    tier: "Knowledge",
    url: "https://www.horbach.de/",
  }),
  partner({
    slug: "shub-mannheim",
    name: "SHUB Mannheim",
    logo: "/brand/partners/shub-mannheim.svg",
    tier: "Knowledge",
    url: "https://www.shub-mannheim.de/",
  }),
  partner({
    slug: "mafinex",
    name: "MAFINEX",
    logo: "/brand/partners/mafinex.svg",
    tier: "Knowledge",
    url: "https://mafinex.next-mannheim.de/",
  }),
  // No verifiable url — see the file comment and ASSETS-TODO.md.
  partner({ slug: "mcei", name: "MCEI", logo: "/brand/partners/mcei.png", tier: "Knowledge" }),
  // Flagship
  partner({
    slug: "procredit-bank",
    name: "ProCredit Bank",
    logo: "/brand/partners/procredit-bank.png",
    tier: "Flagship",
    url: "https://www.procreditbank.de/",
  }),
  partner({
    slug: "eon-inhouse-consulting",
    name: "E.ON Inhouse Consulting",
    logo: "/brand/partners/eon-inhouse-consulting.jpg",
    tier: "Flagship",
    url: "https://www.eon.com/en/about-us/business-units/eon-inhouse-consulting.html",
  }),
  // Sponsoring
  partner({
    slug: "fuchs-petrolub",
    name: "Fuchs Petrolub",
    logo: "/brand/partners/fuchs-petrolub.png",
    tier: "Sponsoring",
    url: "https://www.fuchs.com/de/",
  }),
  partner({
    slug: "heidelberg-materials",
    name: "Heidelberg Materials",
    logo: "/brand/partners/heidelberg-materials.svg",
    tier: "Sponsoring",
    url: "https://www.heidelbergmaterials.com/",
  }),
  partner({
    slug: "absolventum",
    name: "Absolventum",
    logo: "/brand/partners/absolventum.png",
    tier: "Sponsoring",
    url: "https://www.absolventum.de/",
  }),
  // Homepage logo band only — see the file comment above.
  partner({ slug: "htgf", name: "HTGF", logo: "/brand/partners/htgf.png", tier: null }),
  partner({
    slug: "allianz-global-investors",
    name: "Allianz Global Investors",
    logo: "/brand/partners/allianz-global-investors.png",
    tier: null,
  }),
  partner({ slug: "basf", name: "BASF", logo: "/brand/partners/basf.png", tier: null }),
  partner({
    slug: "phoenix-group",
    name: "PHOENIX group",
    logo: "/brand/partners/phoenix-group.png",
    tier: null,
  }),
  partner({ slug: "pg", name: "P&G", logo: "/brand/partners/pg.webp", tier: null }),
];

export { partnerSchema };

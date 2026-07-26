import { z } from "zod";

/**
 * Corporate and network partners shown on the partner page and the homepage
 * logo band. No real partner names, logos, or tiers are known yet — a
 * partnership is a real commercial relationship, never invented, so this
 * holds eight placeholder entries (PARTNER_1..PARTNER_8) rather than an
 * empty array, so the logo band's rhythm can be judged before real partners
 * are confirmed (see ASSETS-TODO.md). `tier` is a free string rather than an
 * enum: the actual sponsorship tier names aren't confirmed, and guessing a
 * tier structure (e.g. "gold"/"silver") would assert an agreement structure
 * that may not match reality.
 */

const partnerSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  logo: z.string().nullable(),
  url: z.url().nullable(),
  tier: z.string().nullable(),
});
export type Partner = z.infer<typeof partnerSchema>;

function placeholderPartner(index: number): Partner {
  return partnerSchema.parse({
    slug: `partner-${index}`,
    name: `PARTNER_${index}`,
    logo: null,
    url: null,
    tier: null,
  });
}

export const partners: Partner[] = [1, 2, 3, 4, 5, 6, 7, 8].map(placeholderPartner);

export { partnerSchema };

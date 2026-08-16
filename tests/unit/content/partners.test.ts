import { describe, expect, it } from "vitest";
import { partners, partnerSchema } from "@/content/partners";

const MARQUEE_ONLY_SLUGS = ["htgf", "allianz-global-investors", "basf", "phoenix-group", "pg"];

describe("content/partners", () => {
  it("has the twelve confirmed partners plus five homepage-marquee-only additions", () => {
    expect(partners).toHaveLength(17);
  });

  it("keeps the five marquee-only additions tier-less, so they never appear on the tiered /partner grid", () => {
    for (const slug of MARQUEE_ONLY_SLUGS) {
      const p = partners.find((partner) => partner.slug === slug);
      expect(p?.tier).toBeNull();
      expect(p?.url).toBeNull();
    }
  });

  it("groups partners into the three confirmed tiers", () => {
    const byTier = Object.groupBy(partners, (p) => p.tier ?? "none");
    expect(byTier.Knowledge?.map((p) => p.slug)).toEqual([
      "sza",
      "kpmg",
      "freudenberg",
      "horbach",
      "shub-mannheim",
      "mafinex",
      "mcei",
    ]);
    expect(byTier.Flagship?.map((p) => p.slug)).toEqual(["procredit-bank", "eon-inhouse-consulting"]);
    expect(byTier.Sponsoring?.map((p) => p.slug)).toEqual([
      "fuchs-petrolub",
      "heidelberg-materials",
      "absolventum",
    ]);
  });

  it("has a real logo path for every partner", () => {
    for (const p of partners) {
      expect(p.logo).toMatch(/^\/brand\/partners\//);
    }
  });

  it("has a confirmed url for every tiered partner except MCEI", () => {
    const bySlug = Object.fromEntries(partners.map((p) => [p.slug, p.url]));
    expect(bySlug.mcei).toBeNull();
    for (const p of partners) {
      if (p.slug === "mcei" || MARQUEE_ONLY_SLUGS.includes(p.slug)) continue;
      expect(p.url).toMatch(/^https:\/\//);
    }
  });

  it("validates every exported partner against the schema", () => {
    for (const partner of partners) {
      expect(() => partnerSchema.parse(partner)).not.toThrow();
    }
  });

  it("accepts a well-formed partner", () => {
    expect(() =>
      partnerSchema.parse({
        slug: "example-gmbh",
        name: "Example GmbH",
        logo: null,
        url: "https://example.com",
        tier: null,
      }),
    ).not.toThrow();
  });

  it("rejects a partner with a malformed slug or URL", () => {
    const base = { name: "Example GmbH", logo: null, tier: null };
    expect(() => partnerSchema.parse({ ...base, slug: "Example GmbH", url: null })).toThrow();
    expect(() => partnerSchema.parse({ ...base, slug: "example", url: "not-a-url" })).toThrow();
  });
});

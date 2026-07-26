import { describe, expect, it } from "vitest";
import { partners, partnerSchema } from "@/content/partners";

describe("content/partners", () => {
  it("has eight placeholder entries until real partnerships are confirmed", () => {
    expect(partners.map((p) => p.slug)).toEqual([
      "partner-1",
      "partner-2",
      "partner-3",
      "partner-4",
      "partner-5",
      "partner-6",
      "partner-7",
      "partner-8",
    ]);
  });

  it("uses language-neutral placeholder tokens, not invented real partner names", () => {
    for (const [index, partner] of partners.entries()) {
      expect(partner.name).toBe(`PARTNER_${index + 1}`);
    }
  });

  it("leaves logo, url, and tier null until confirmed", () => {
    for (const partner of partners) {
      expect(partner.logo).toBeNull();
      expect(partner.url).toBeNull();
      expect(partner.tier).toBeNull();
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

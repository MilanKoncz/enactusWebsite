import { describe, expect, it } from "vitest";
import { alumniEmployers, alumniEmployerSchema } from "@/content/alumniEmployers";

describe("content/alumniEmployers", () => {
  it("has one entry per company, no duplicate slugs", () => {
    const slugs = alumniEmployers.map((employer) => employer.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("points every logo at the alumni-employers brand folder", () => {
    for (const employer of alumniEmployers) {
      expect(employer.logo).toBe(`/brand/alumni-employers/${employer.slug}.png`);
    }
  });

  it("validates every exported entry against the schema", () => {
    for (const employer of alumniEmployers) {
      expect(() => alumniEmployerSchema.parse(employer)).not.toThrow();
    }
  });

  it("rejects a malformed slug", () => {
    expect(() =>
      alumniEmployerSchema.parse({ slug: "BASF", name: "BASF", logo: "/brand/alumni-employers/basf.png" }),
    ).toThrow();
  });
});

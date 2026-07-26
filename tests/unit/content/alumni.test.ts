import { describe, expect, it } from "vitest";
import { alumni, alumnusSchema } from "@/content/alumni";

describe("content/alumni", () => {
  it("has three placeholder entries until real alumni are confirmed", () => {
    expect(alumni.map((a) => a.slug)).toEqual(["alumnus-1", "alumnus-2", "alumnus-3"]);
  });

  it("uses language-neutral placeholder tokens, not invented real names or quotes", () => {
    for (const [index, alumnus] of alumni.entries()) {
      expect(alumnus.name).toBe(`ALUMNUS_${index + 1}`);
      expect(alumnus.currentRole).toBe(`POSITION_${index + 1}`);
      expect(alumnus.quote).toBe(`STATEMENT_${index + 1}`);
    }
  });

  it("leaves photo and linkedinUrl null until confirmed", () => {
    for (const alumnus of alumni) {
      expect(alumnus.photo).toBeNull();
      expect(alumnus.linkedinUrl).toBeNull();
    }
  });

  it("validates every exported alumnus against the schema", () => {
    for (const alumnus of alumni) {
      expect(() => alumnusSchema.parse(alumnus)).not.toThrow();
    }
  });

  it("accepts a well-formed alumnus", () => {
    expect(() =>
      alumnusSchema.parse({
        slug: "jane-doe",
        name: "Jane Doe",
        currentRole: "Product Manager @ Example GmbH",
        quote: "Enactus hat mir gezeigt, wie man wirklich etwas umsetzt.",
        linkedinUrl: "https://www.linkedin.com/in/jane-doe",
        photo: null,
      }),
    ).not.toThrow();
  });

  it("rejects an alumnus with a malformed slug or LinkedIn URL", () => {
    const base = { name: "Jane Doe", currentRole: null, quote: "Ein Zitat.", photo: null };
    expect(() =>
      alumnusSchema.parse({ ...base, slug: "Jane Doe", linkedinUrl: null }),
    ).toThrow();
    expect(() =>
      alumnusSchema.parse({ ...base, slug: "jane-doe", linkedinUrl: "not-a-url" }),
    ).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { partnerStatements, partnerStatementSchema } from "@/content/partnerStatements";

describe("content/partnerStatements", () => {
  it("has the four confirmed statements in order", () => {
    expect(partnerStatements.map((s) => s.name)).toEqual([
      "Moritz Knabe",
      "Pauline Machtolf",
      "Alexander Müller",
      "Cornelius Bossers",
    ]);
  });

  it("derives role and quote message keys from the slug", () => {
    const moritz = partnerStatements.find((s) => s.slug === "moritz-knabe")!;
    expect(moritz.role).toBe("PartnerStatements.moritz-knabe.role");
    expect(moritz.quote).toBe("PartnerStatements.moritz-knabe.quote");
  });

  it("validates every exported statement against the schema", () => {
    for (const statement of partnerStatements) {
      expect(() => partnerStatementSchema.parse(statement)).not.toThrow();
    }
  });

  it("rejects a statement with a malformed slug", () => {
    expect(() =>
      partnerStatementSchema.parse({
        slug: "Not A Slug",
        name: "Test",
        role: "PartnerStatements.test.role",
        quote: "PartnerStatements.test.quote",
      }),
    ).toThrow();
  });
});

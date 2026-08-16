import { describe, expect, it } from "vitest";
import { benefitKeySchema, benefits, benefitSchema } from "@/content/benefits";

describe("content/benefits", () => {
  it("lists the four board-confirmed benefits in order", () => {
    expect(benefits.map((b) => b.key)).toEqual([
      "responsibility",
      "teamwork",
      "alumniAdvisors",
      "community",
    ]);
    expect(benefits.map((b) => b.order)).toEqual([1, 2, 3, 4]);
  });

  it("validates every exported benefit against the schema", () => {
    for (const b of benefits) {
      expect(() => benefitSchema.parse(b)).not.toThrow();
    }
  });

  it("rejects a benefit with an unknown key", () => {
    expect(() => benefitSchema.parse({ key: "mentoring", order: 1 })).toThrow();
  });

  it("rejects a non-positive order", () => {
    expect(() => benefitSchema.parse({ key: "responsibility", order: 0 })).toThrow();
  });

  it("keeps the key enum in sync with the exported benefit list", () => {
    expect(benefitKeySchema.options).toEqual(benefits.map((b) => b.key));
  });
});

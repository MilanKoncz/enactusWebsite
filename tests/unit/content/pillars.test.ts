import { describe, expect, it } from "vitest";
import { pillarKeySchema, pillars, pillarSchema } from "@/content/pillars";

describe("content/pillars", () => {
  it("lists the three confirmed pillars in order", () => {
    expect(pillars.map((p) => p.key)).toEqual(["esg", "execution", "network"]);
    expect(pillars.map((p) => p.order)).toEqual([1, 2, 3]);
  });

  it("validates every exported pillar against the schema", () => {
    for (const p of pillars) {
      expect(() => pillarSchema.parse(p)).not.toThrow();
    }
  });

  it("rejects a pillar with an unknown key", () => {
    expect(() => pillarSchema.parse({ key: "impact", order: 1 })).toThrow();
  });

  it("rejects a non-positive order", () => {
    expect(() => pillarSchema.parse({ key: "esg", order: 0 })).toThrow();
  });

  it("keeps the key enum in sync with the exported pillar list", () => {
    expect(pillarKeySchema.options).toEqual(pillars.map((p) => p.key));
  });

  it("has a real background photo for every pillar", () => {
    for (const p of pillars) {
      expect(p.image).toMatch(/^\/brand\/pillars\//);
    }
  });
});

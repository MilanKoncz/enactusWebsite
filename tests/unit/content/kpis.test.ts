import { describe, expect, it } from "vitest";
import { kpiSchema, kpis } from "@/content/kpis";
import { org } from "@/content/org";

describe("content/kpis", () => {
  it("has the five headline figures", () => {
    expect(kpis.map((k) => k.key)).toEqual([
      "nationalChampionships",
      "spinoffs",
      "funding",
      "projectIterations",
      "foundedYear",
    ]);
  });

  it("matches the figures given for the club", () => {
    const byKey = Object.fromEntries(kpis.map((k) => [k.key, k.value]));
    expect(byKey.nationalChampionships).toBe(8);
    expect(byKey.spinoffs).toBe(5);
    expect(byKey.funding).toBe(250_000);
    expect(byKey.projectIterations).toBe(70);
    expect(byKey.foundedYear).toBe(org.foundingYear.year);
  });

  it("starts every KPI unverified pending board confirmation", () => {
    expect(kpis.every((k) => k.verified === false)).toBe(true);
  });

  it("validates every exported KPI against the schema", () => {
    for (const k of kpis) {
      expect(() => kpiSchema.parse(k)).not.toThrow();
    }
  });

  it("rejects a KPI with an unknown key", () => {
    expect(() =>
      kpiSchema.parse({ key: "membersCount", value: 42, verified: false, asOf: "2026-07-26" }),
    ).toThrow();
  });

  it("rejects a KPI with a malformed asOf date", () => {
    expect(() =>
      kpiSchema.parse({ key: "spinoffs", value: 5, verified: false, asOf: "26-07-2026" }),
    ).toThrow();
  });
});

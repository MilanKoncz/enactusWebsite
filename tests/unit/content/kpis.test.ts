import { describe, expect, it } from "vitest";
import { kpiSchema, kpis } from "@/content/kpis";

describe("content/kpis", () => {
  it("has the five headline figures", () => {
    expect(kpis.map((k) => k.key)).toEqual([
      "nationalChampionships",
      "worldCupFinals",
      "spinoffs",
      "funding",
      "projectIterations",
    ]);
  });

  it("matches the figures confirmed by the board", () => {
    const byKey = Object.fromEntries(kpis.map((k) => [k.key, k.value]));
    expect(byKey.nationalChampionships).toBe(8);
    expect(byKey.worldCupFinals).toBe(2);
    expect(byKey.spinoffs).toBe(5);
    expect(byKey.funding).toBe(150_000);
    expect(byKey.projectIterations).toBe(65);
  });

  it("marks every KPI as board-confirmed", () => {
    expect(kpis.every((k) => k.verified === true)).toBe(true);
  });

  it("validates every exported KPI against the schema", () => {
    for (const k of kpis) {
      expect(() => kpiSchema.parse(k)).not.toThrow();
    }
  });

  it("rejects a KPI with an unknown key", () => {
    expect(() =>
      kpiSchema.parse({ key: "foundedYear", value: 2003, verified: true, asOf: "2026-08-15" }),
    ).toThrow();
  });

  it("rejects a KPI with a malformed asOf date", () => {
    expect(() =>
      kpiSchema.parse({ key: "spinoffs", value: 5, verified: false, asOf: "26-07-2026" }),
    ).toThrow();
  });
});

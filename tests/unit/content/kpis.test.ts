import { describe, expect, it } from "vitest";
import { kpiSchema, kpis } from "@/content/kpis";

describe("content/kpis", () => {
  it("has the five headline figures in the board-requested order", () => {
    expect(kpis.map((k) => k.key)).toEqual([
      "projectIterations",
      "funding",
      "nationalChampionships",
      "worldRanking",
      "spinoffs",
    ]);
  });

  it("matches the figures confirmed by the board", () => {
    const byKey = Object.fromEntries(kpis.map((k) => [k.key, k.value]));
    expect(byKey.projectIterations).toBe(65);
    expect(byKey.funding).toBe(150_000);
    expect(byKey.nationalChampionships).toBe(8);
    expect(byKey.worldRanking).toBe(16);
    expect(byKey.spinoffs).toBe(5);
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
    expect(() => kpiSchema.parse({ key: "worldCupFinals", value: 2, verified: true })).toThrow();
  });

  it("no longer carries a per-KPI asOf date — dropped from the schema along with the homepage's 'Stand' line", () => {
    for (const k of kpis) {
      expect(k).not.toHaveProperty("asOf");
    }
  });
});

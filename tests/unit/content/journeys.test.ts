import { describe, expect, it } from "vitest";
import { tripKeySchema, trips, tripSchema } from "@/content/journeys";

describe("content/journeys", () => {
  it("has the four confirmed trips, most recent first", () => {
    expect(trips.map((t) => t.key)).toEqual(["fss-2026", "fss-2025", "hws-2024", "fss-2024"]);
    expect(trips.map((t) => t.order)).toEqual([1, 2, 3, 4]);
  });

  it("has a real destination and year for every trip", () => {
    expect(trips.map((t) => t.destination)).toEqual(["St. Gallen", "Berlin", "München", "Berlin"]);
    expect(trips.map((t) => t.year)).toEqual([2026, 2025, 2024, 2024]);
  });

  it("validates every exported trip against the schema", () => {
    for (const t of trips) {
      expect(() => tripSchema.parse(t)).not.toThrow();
    }
  });

  it("accepts a well-formed trip with a real destination and year", () => {
    expect(() =>
      tripSchema.parse({ key: "fss-2026", order: 1, destination: "St. Gallen", year: 2026 }),
    ).not.toThrow();
  });

  it("rejects a trip with an unknown key or non-positive order", () => {
    const base = { destination: null, year: null };
    expect(() => tripSchema.parse({ ...base, key: "not-a-trip", order: 1 })).toThrow();
    expect(() => tripSchema.parse({ ...base, key: "fss-2026", order: 0 })).toThrow();
  });

  it("keeps the key enum in sync with the exported trip list", () => {
    expect(tripKeySchema.options).toEqual(trips.map((t) => t.key));
  });
});

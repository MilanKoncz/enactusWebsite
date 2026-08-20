import { describe, expect, it } from "vitest";
import { germanTeamCities, germanTeamCitySchema, networkStats, networkStatsSchema } from "@/content/network";

describe("content/network", () => {
  it("matches the confirmed Enactus Germany and Enactus Global figures", () => {
    expect(networkStats).toMatchObject({
      studentsGermany: 1700,
      universitiesGermany: 24,
      countriesGlobal: 34,
      verified: true,
    });
  });

  it("deliberately has no global student count field", () => {
    expect(networkStats).not.toHaveProperty("studentsGlobal");
  });

  it("validates the exported network stats", () => {
    expect(() => networkStatsSchema.parse(networkStats)).not.toThrow();
  });

  it("rejects a negative or zero figure", () => {
    expect(() => networkStatsSchema.parse({ ...networkStats, studentsGermany: 0 })).toThrow();
    expect(() => networkStatsSchema.parse({ ...networkStats, countriesGlobal: -1 })).toThrow();
  });

  it("rejects a malformed asOf date", () => {
    expect(() => networkStatsSchema.parse({ ...networkStats, asOf: "not-a-date" })).toThrow();
  });

  // 23, not 24: every German location except Mannheim itself, which has
  // its own dedicated, always-labelled, unlinked point on the map
  // (GermanyMap.tsx) rather than an entry here — the map's one and only
  // roster (board feedback, 2026-08-20: no more separate "featured five"
  // list to keep in sync with it).
  it("lists all 23 German locations except Mannheim", () => {
    expect(germanTeamCities).toHaveLength(23);
    for (const city of germanTeamCities) {
      expect(city.name).not.toBe("Mannheim");
    }
    for (const name of ["München", "Münster", "Hamburg", "Köln", "Karlsruhe"]) {
      expect(germanTeamCities.map((c) => c.name)).toContain(name);
    }
  });

  it("validates every exported German team city against the schema", () => {
    for (const city of germanTeamCities) {
      expect(() => germanTeamCitySchema.parse(city)).not.toThrow();
    }
  });

  it("gives every German team city a unique key", () => {
    const keys = germanTeamCities.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  // Straubing is the one confirmed exception (ASSETS-TODO.md: its listed
  // site 404s) — every other city was opened and confirmed live
  // 2026-08-20, the same per-URL standard content-guide.md sets for
  // partner links.
  it("has a confirmed https URL for every German team city except Straubing", () => {
    for (const city of germanTeamCities) {
      if (city.key === "straubing") {
        expect(city.url).toBeNull();
      } else {
        expect(city.url).toMatch(/^https:\/\//);
      }
    }
  });
});

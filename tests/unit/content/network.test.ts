import { describe, expect, it } from "vitest";
import {
  germanTeamCities,
  germanTeamCitySchema,
  networkStats,
  networkStatsSchema,
  teamLinkSchema,
  teamLinks,
} from "@/content/network";

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

  it("links exactly the five sibling teams named in the /events brief", () => {
    expect(teamLinks.map((t) => t.name)).toEqual(["München", "Münster", "Hamburg", "Köln", "Karlsruhe"]);
  });

  it("has a confirmed URL for every team — none needed a placeholder", () => {
    for (const team of teamLinks) {
      expect(team.url).toMatch(/^https:\/\//);
    }
  });

  it("validates every exported team link against the schema", () => {
    for (const team of teamLinks) {
      expect(() => teamLinkSchema.parse(team)).not.toThrow();
    }
  });

  it("rejects a team link with an unknown key", () => {
    expect(() =>
      teamLinkSchema.parse({ key: "not-a-team", name: "Test", url: null }),
    ).toThrow();
  });

  // 23, not 24: every German location except Mannheim itself, which has
  // its own dedicated, always-labelled, unlinked point on the map
  // (GermanyMap.tsx) rather than an entry here. teamLinks' five names all
  // appear again in here too — the map's full roster, not a "the other
  // ones" list the way it used to be (board feedback, 2026-08-20: link
  // every team, not just the five originally-named partners).
  it("lists all 23 German locations except Mannheim, including the five teamLinks names", () => {
    expect(germanTeamCities).toHaveLength(23);
    const cityNames = germanTeamCities.map((c) => c.name);
    for (const city of germanTeamCities) {
      expect(city.name).not.toBe("Mannheim");
    }
    for (const team of teamLinks) {
      expect(cityNames).toContain(team.name);
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

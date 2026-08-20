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

  it("lists exactly the 18 other German locations, none overlapping the five linked teams or Mannheim", () => {
    expect(germanTeamCities).toHaveLength(18);
    const linkedNames = teamLinks.map((t) => t.name);
    for (const city of germanTeamCities) {
      expect(linkedNames).not.toContain(city.name);
      expect(city.name).not.toBe("Mannheim");
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
});

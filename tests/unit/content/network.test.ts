import { describe, expect, it } from "vitest";
import { networkStats, networkStatsSchema, teamLinkSchema, teamLinks } from "@/content/network";

describe("content/network", () => {
  it("matches the confirmed Enactus Germany and Enactus Global figures", () => {
    expect(networkStats).toMatchObject({
      studentsGermany: 1700,
      universitiesGermany: 30,
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
});

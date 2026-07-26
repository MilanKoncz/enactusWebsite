import { describe, expect, it } from "vitest";
import { networkStats, networkStatsSchema } from "@/content/network";

describe("content/network", () => {
  it("matches the confirmed Enactus Germany and Enactus Global figures", () => {
    expect(networkStats).toMatchObject({
      studentsGermany: 1700,
      universitiesGermany: 30,
      countriesGlobal: 34,
      studentsGlobal: 42000,
      verified: true,
    });
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
});

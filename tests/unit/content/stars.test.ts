import { describe, expect, it } from "vitest";
import { starSchema, stars } from "@/content/stars";

describe("content/stars", () => {
  it("has exactly 8 entries named STAR_1 through STAR_8", () => {
    expect(stars.map((s) => s.key)).toEqual([
      "STAR_1",
      "STAR_2",
      "STAR_3",
      "STAR_4",
      "STAR_5",
      "STAR_6",
      "STAR_7",
      "STAR_8",
    ]);
  });

  it("has a real name for every star", () => {
    expect(stars.map((s) => s.name)).toEqual([
      "Blauherz",
      "Moufense",
      "effishent",
      "Sanagua",
      "Back on Track",
      "Flat Mates",
      "Stadthonig",
      "Sunte",
    ]);
  });

  it("marks six stars as board-confirmed and two as not yet confirmed", () => {
    const byKey = Object.fromEntries(stars.map((s) => [s.key, s.verified]));
    expect(byKey.STAR_7).toBe(false);
    expect(byKey.STAR_8).toBe(false);
    for (const key of ["STAR_1", "STAR_2", "STAR_3", "STAR_4", "STAR_5", "STAR_6"]) {
      expect(byKey[key]).toBe(true);
    }
  });

  it("leaves logo null until confirmed", () => {
    for (const s of stars) {
      expect(s.logo).toBeNull();
    }
  });

  it("has YouTube IDs only for Moufense and Flat Mates", () => {
    const byKey = Object.fromEntries(stars.map((s) => [s.key, s.youtubeId]));
    expect(byKey.STAR_2).toBe("9Ord09u363s");
    expect(byKey.STAR_6).toBe("cY6dSD79fqo");
    for (const key of ["STAR_1", "STAR_3", "STAR_4", "STAR_5", "STAR_7", "STAR_8"]) {
      expect(byKey[key]).toBeNull();
    }
  });

  it("derives the description message key from the star's key", () => {
    expect(stars[0].description).toBe("Stars.STAR_1.description");
  });

  it("validates every exported star against the schema", () => {
    for (const s of stars) {
      expect(() => starSchema.parse(s)).not.toThrow();
    }
  });

  it("rejects a star with a key outside STAR_1..STAR_8", () => {
    expect(() =>
      starSchema.parse({
        key: "STAR_9",
        name: "Test",
        logo: null,
        description: "Stars.STAR_9.description",
        status: null,
        verified: true,
        youtubeId: null,
      }),
    ).toThrow();
  });

  it("rejects a malformed YouTube ID", () => {
    expect(() =>
      starSchema.parse({
        key: "STAR_1",
        name: "Test",
        logo: null,
        description: "Stars.STAR_1.description",
        status: null,
        verified: true,
        youtubeId: "not-a-valid-id!!",
      }),
    ).toThrow();
  });

  it("rejects an invalid status value", () => {
    expect(() =>
      starSchema.parse({
        key: "STAR_1",
        name: "Test",
        logo: null,
        description: "Stars.STAR_1.description",
        status: "on-hold",
        verified: true,
        youtubeId: null,
      }),
    ).toThrow();
  });
});

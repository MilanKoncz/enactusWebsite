import { describe, expect, it } from "vitest";
import { starSchema, stars } from "@/content/stars";

describe("content/stars", () => {
  it("has exactly 7 entries — STAR_7 stays unassigned so an 8th slot renders as a visible empty state", () => {
    expect(stars.map((s) => s.key)).toEqual([
      "STAR_1",
      "STAR_2",
      "STAR_3",
      "STAR_4",
      "STAR_5",
      "STAR_6",
      "STAR_8",
    ]);
  });

  it("has a real name for every star", () => {
    expect(stars.map((s) => s.name)).toEqual([
      "Blauherz",
      "Moufense",
      "effishent",
      "Sanagua",
      "Afya",
      "Differgy",
      "Sunte",
    ]);
  });

  it("marks six stars as board-confirmed and one (Sunte) as not yet confirmed", () => {
    const byKey = Object.fromEntries(stars.map((s) => [s.key, s.verified]));
    expect(byKey.STAR_8).toBe(false);
    for (const key of ["STAR_1", "STAR_2", "STAR_3", "STAR_4", "STAR_5", "STAR_6"]) {
      expect(byKey[key]).toBe(true);
    }
  });

  it("has real logos for Blauherz, Moufense, Afya, and Differgy, null for the rest", () => {
    const byKey = Object.fromEntries(stars.map((s) => [s.key, s.logo]));
    expect(byKey.STAR_1).toBe("/stars/blauherz-logo.png");
    expect(byKey.STAR_2).toBe("/stars/moufense-logo.png");
    expect(byKey.STAR_5).toBe("/projects/afya-logo.png");
    expect(byKey.STAR_6).toBe("/projects/differgy-logo.png");
    for (const key of ["STAR_3", "STAR_4", "STAR_8"]) {
      expect(byKey[key]).toBeNull();
    }
  });

  it("has a YouTube ID only for Moufense", () => {
    const byKey = Object.fromEntries(stars.map((s) => [s.key, s.youtubeId]));
    expect(byKey.STAR_2).toBe("9Ord09u363s");
    for (const key of ["STAR_1", "STAR_3", "STAR_4", "STAR_5", "STAR_6", "STAR_8"]) {
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

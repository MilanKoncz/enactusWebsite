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

  it("leaves logo, status, and youtubeId null until confirmed", () => {
    for (const s of stars) {
      expect(s.logo).toBeNull();
      expect(s.status).toBeNull();
      expect(s.youtubeId).toBeNull();
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
        logo: null,
        description: "Stars.STAR_9.description",
        status: null,
        youtubeId: null,
      }),
    ).toThrow();
  });

  it("rejects a malformed YouTube ID", () => {
    expect(() =>
      starSchema.parse({
        key: "STAR_1",
        logo: null,
        description: "Stars.STAR_1.description",
        status: null,
        youtubeId: "not-a-valid-id!!",
      }),
    ).toThrow();
  });

  it("rejects an invalid status value", () => {
    expect(() =>
      starSchema.parse({
        key: "STAR_1",
        logo: null,
        description: "Stars.STAR_1.description",
        status: "on-hold",
        youtubeId: null,
      }),
    ).toThrow();
  });
});

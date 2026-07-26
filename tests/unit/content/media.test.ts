import { describe, expect, it } from "vitest";
import { heroMedia, heroMediaSchema } from "@/content/media";

describe("content/media", () => {
  it("leaves poster, mobile image, and sources unset until footage is shot", () => {
    expect(heroMedia.posterSrc).toBeNull();
    expect(heroMedia.mobileImageSrc).toBeNull();
    expect(heroMedia.sources).toEqual([]);
  });

  it("reserves the intended aspect ratio so the hero has no layout shift once footage arrives", () => {
    expect(heroMedia.width).toBe(1920);
    expect(heroMedia.height).toBe(1080);
  });

  it("validates the exported hero media", () => {
    expect(() => heroMediaSchema.parse(heroMedia)).not.toThrow();
  });

  it("rejects a non-positive width or height", () => {
    expect(() => heroMediaSchema.parse({ ...heroMedia, width: 0 })).toThrow();
    expect(() => heroMediaSchema.parse({ ...heroMedia, height: -1 })).toThrow();
  });
});

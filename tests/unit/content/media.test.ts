import { describe, expect, it } from "vitest";
import { heroMedia, heroMediaSchema } from "@/content/media";

describe("content/media", () => {
  it("has a real poster and video sources, WebM first", () => {
    expect(heroMedia.posterSrc).toBe("/video/hero-poster.jpg");
    expect(heroMedia.sources).toEqual([
      { src: "/video/hero-video.webm", type: "video/webm" },
      { src: "/video/hero-video.mp4", type: "video/mp4" },
    ]);
  });

  it("leaves the mobile still image unset until one is delivered", () => {
    expect(heroMedia.mobileImageSrc).toBeNull();
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

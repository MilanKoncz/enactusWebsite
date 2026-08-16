import { z } from "zod";

/**
 * The homepage hero's video/poster/mobile-image triple. Video and poster are
 * real (board media handover, 2026-08-16); mobileImageSrc still has no still
 * frame, so the hero shows no image below the `md` breakpoint (see
 * ASSETS-TODO.md). width/height match the delivered video's aspect ratio.
 * `sources` holds one entry per encoded format (e.g. webm, mp4).
 */

const videoSourceSchema = z.object({
  src: z.string(),
  type: z.string(),
});
export type VideoSource = z.infer<typeof videoSourceSchema>;

const heroMediaSchema = z.object({
  posterSrc: z.string().nullable(),
  mobileImageSrc: z.string().nullable(),
  sources: z.array(videoSourceSchema),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type HeroMedia = z.infer<typeof heroMediaSchema>;

export const heroMedia: HeroMedia = heroMediaSchema.parse({
  posterSrc: "/video/hero-poster.png",
  mobileImageSrc: null,
  sources: [{
      src: "/video/hero-video.mp4",
      type: "video/mp4",
    }],
  width: 1920,
  height: 1080,
});

export { heroMediaSchema };

import { z } from "zod";

/**
 * The homepage hero's video/poster/mobile-image triple. No footage has been
 * shot yet, so every source stays null — width/height are set to the
 * intended aspect ratio so the hero reserves its final on-screen size before
 * any asset exists, and no layout shift occurs once it's delivered (see
 * ASSETS-TODO.md). `sources` holds one entry per encoded format (e.g. webm,
 * mp4); empty until footage exists.
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

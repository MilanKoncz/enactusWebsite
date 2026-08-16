"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { heroMedia } from "@/content/media";

// Tailwind's own `md`, as a query string — the element is `md:block` below,
// and playback has to switch on the exact same boundary the visibility does.
const DESKTOP_QUERY = "(min-width: 768px)";

// The hero's background video. Playback is started from here rather than
// with an `autoplay` attribute, for two reasons that the attribute cannot
// express:
//
//   1. docs/design-system.md's motion rule 4 — a reduced-motion preference
//      has to mean the video never starts, not that it starts and is paused
//      a frame later.
//   2. The element is `hidden` below `md`, and a hidden <video> still
//      downloads and plays. With `preload="none"` and no autoplay attribute,
//      a phone fetches the poster and nothing else — the file itself is
//      43 MB.
//
// If the browser refuses the play() call anyway, the poster simply stays,
// which is the same thing every visitor below `md` already sees.
export function HeroVideo() {
  const reducedMotion = usePrefersReducedMotion();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (reducedMotion || !isDesktop) {
      video.pause();
      return;
    }

    void video.play().catch(() => {});
  }, [reducedMotion, isDesktop]);

  return (
    <video
      ref={ref}
      className="hidden h-full w-full object-cover md:block"
      muted
      playsInline
      loop
      preload="none"
      poster={heroMedia.posterSrc ?? undefined}
    >
      {heroMedia.sources.map((source) => (
        <source key={source.src} src={source.src} type={source.type} />
      ))}
    </video>
  );
}

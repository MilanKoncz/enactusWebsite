"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { heroMedia } from "@/content/media";

// Tailwind's own `md`, as a query string — the element is `md:block` below,
// and playback has to switch on the exact same boundary the visibility does.
const DESKTOP_QUERY = "(min-width: 768px)";

// The hero's background video.
//
// Nothing is rendered at all below `md`. Hiding the element with CSS is not
// enough: `display: none` does not stop a <video> from loading, and while
// `preload="none"` holds in Chromium, WebKit ignores it and fetches the file
// regardless — caught by the e2e check on a real WebKit, where a phone was
// pulling the whole 43 MB video plus a 1.2 MB poster for an element it can
// never see. Not rendering it is the only guarantee that holds in every
// engine, and it drops the poster from the phone's payload too.
//
// Playback is then started from here rather than with an `autoplay`
// attribute, so that docs/design-system.md's motion rule 4 can hold: a
// reduced-motion preference means the video never starts, not that it starts
// and is paused a frame later. If the browser refuses the play() call
// anyway, the poster stays — the same thing every visitor below `md`
// already sees.
export function HeroVideo() {
  const reducedMotion = usePrefersReducedMotion();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (reducedMotion) {
      video.pause();
      return;
    }

    void video.play().catch(() => {});
  }, [reducedMotion, isDesktop]);

  // After the hooks, never before them — an early return above would make
  // the hook order conditional.
  if (!isDesktop) return null;

  return (
    <video
      ref={ref}
      className="h-full w-full object-cover"
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

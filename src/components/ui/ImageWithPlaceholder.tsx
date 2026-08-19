"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

export type ImageWithPlaceholderProps = ImageProps;

// Reserves visual weight while a photo loads instead of letting the page pop
// content in around it (CLAUDE.md: "no layout shift on load") — the caller
// still owns the aspect-ratio wrapper (aspect-3/4, aspect-video, ...) and
// `position: relative` exactly as with next/image directly.
//
// The wash sits *above* the photo (a later sibling, not a lower z-index) and
// fades itself out once the photo has loaded, rather than fading the photo
// itself in. That's deliberate, not incidental: several callers (BoardGrid's
// portraits) already put their own `transition-transform` on the <img>'s
// className for a hover zoom, and a second, component-owned
// `transition-opacity` on that same element would collide with it — Tailwind
// utility classes for the same CSS property don't merge, the later one wins
// outright, so either the fade or the zoom transition would silently stop
// working. Leaving the <img>'s className untouched and doing the fade on an
// element this component fully owns sidesteps that class ever being fought
// over.
//
// A flat, calm wash — never a spinner, never a text message (board brief,
// 2026-08-20): a loading photo is not an event worth narrating.
// prefers-reduced-motion drops the pulse to a static fill, the same
// motion-reduce convention already used elsewhere (PartnerMarquee's track,
// ToolOrbit's spin).
export function ImageWithPlaceholder({ onLoad, alt, src, ...props }: ImageWithPlaceholderProps) {
  const [loaded, setLoaded] = useState(false);

  // Guards against a stale "loaded" state if this exact component instance
  // is ever reused for a different photo (a carousel advancing, say) — the
  // new photo should show the placeholder again while it loads, not the
  // previous photo's now-irrelevant loaded flag. Adjusting state during
  // render (React's own documented pattern for "reset state when a prop
  // changes") rather than in an effect: an effect would commit the loaded
  // photo for one frame before resetting it back to the placeholder.
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoaded(false);
  }

  return (
    <>
      <Image
        {...props}
        src={src}
        alt={alt}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-sand/20 transition-opacity duration-[var(--duration-calm)] ease-signature ${
          loaded ? "opacity-0" : "animate-pulse opacity-100 motion-reduce:animate-none"
        }`}
      />
    </>
  );
}

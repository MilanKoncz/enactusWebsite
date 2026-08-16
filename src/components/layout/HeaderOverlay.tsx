"use client";

import { useEffect, useRef } from "react";
import { useHeaderSurface } from "@/components/layout/HeaderSurface";

// Marks the bottom edge of a hero section that the fixed header should sit
// transparent over. rootMargin shrinks the observed viewport by 96px from
// the top — exactly the header's height (h-24, matching the sentinel
// spacer in Header.tsx) — so `isIntersecting` flips to false at the precise
// moment this point scrolls up underneath the header, not while it's still
// visible below it. IntersectionObserver fires once immediately on
// `observe()`, so on load (hero fully visible, this sentinel far below the
// fold) the header starts overlaid without any extra setup step. Unmounting
// (navigating away from the page entirely) resets to solid as a safety net.
export function HeaderOverlay() {
  const { setOverlaid } = useHeaderSurface();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOverlaid(entry.isIntersecting), {
      rootMargin: "-50px 0px 0px 0px",
      threshold: 0,
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      setOverlaid(false);
    };
  }, [setOverlaid]);

  return <div ref={ref} aria-hidden="true" className="h-px" />;
}

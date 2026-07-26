"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

export type RotatingTextProps = {
  terms: string[];
  intervalMs?: number;
  className?: string;
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// Reduced-motion is a live property of the browser, external to React state
// — useSyncExternalStore subscribes to it directly instead of mirroring it
// into state from inside an effect (which would need a synchronous setState
// call on mount, an anti-pattern react-hooks/set-state-in-effect flags for
// good reason: it causes an extra render pass). The server snapshot is
// `false` (no matchMedia during SSR) — matching the terms[0]-on-first-paint
// guarantee below, since the rotation effect no-ops until this resolves.
export function RotatingText({ terms, intervalMs = 3000, className }: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );

  useEffect(() => {
    if (reducedMotion || terms.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % terms.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [reducedMotion, terms.length, intervalMs]);

  return (
    // All terms are stacked in the same grid cell (col-start-1 row-start-1
    // on every child) — CSS Grid sizes a track to the largest item placed
    // in it even when items overlap, so the box is as wide as the longest
    // term from first paint and the swap can never shift layout, unlike
    // sizing that follows the current word (docs/design-system.md motion
    // rule 5: no animating width/height). The rotating group is
    // aria-hidden; a static sr-only span carries the first term so
    // assistive tech reads one stable sentence, never a repeating
    // announcement. Initial index is 0 on both server and client, so
    // there's no hydration mismatch and no flash before the first paint.
    <span className={cn("inline-grid text-left", className)}>
      {terms.map((term, termIndex) => (
        <span
          key={term}
          aria-hidden="true"
          className={cn(
            "col-start-1 row-start-1 transition-opacity duration-500",
            termIndex === index ? "opacity-100" : "opacity-0",
          )}
        >
          {term}
        </span>
      ))}
      <span className="sr-only">{terms[0]}</span>
    </span>
  );
}

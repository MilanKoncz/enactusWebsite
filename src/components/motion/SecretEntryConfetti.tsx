"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfettiBurst } from "@/components/motion/ConfettiBurst";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

// Easter egg 7/7 (docs/eastereggs.md): /secret fires the same confetti
// burst as the hero logo's triple-click and the contact form's success
// state (ConfettiBurst) — reused, not rebuilt — once, on mount. Centered in
// the viewport rather than on a single element's rect, since unlike those
// two callers there's no one thing on this page the burst is "from". Never
// under prefers-reduced-motion: the page stays reachable and readable, it
// just never renders this component's burst.
export function SecretEntryConfetti() {
  const reducedMotion = usePrefersReducedMotion();
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    // Deferred a frame rather than called synchronously in the effect body
    // (react-hooks/set-state-in-effect) — same fix AnimatedFigure.tsx uses
    // for its own mount-triggered setState.
    const frame = requestAnimationFrame(() => {
      setBurst({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    });
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  const handleDone = useCallback(() => setBurst(null), []);

  if (!burst) return null;
  return <ConfettiBurst originX={burst.x} originY={burst.y} onDone={handleDone} />;
}

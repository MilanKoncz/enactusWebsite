"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ConfettiBurst } from "@/components/motion/ConfettiBurst";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const BURST_INTERVAL_MS = 4000;

// Easter egg 7/7 (docs/eastereggs.md): /secret is a party, not a chill-out
// room — the same ConfettiBurst the hero logo and contact form use (see egg
// 2), reused rather than rebuilt, but fired repeatedly: once on mount, then
// again every BURST_INTERVAL_MS for as long as the page stays open. Each
// burst starts from a fresh, slightly randomized point near the top of the
// viewport, so it reads as party poppers going off rather than the same
// single spot looping. `burst.id` (state, not a ref — react-hooks/refs
// disallows reading a ref's `.current` during render) keys the rendered
// ConfettiBurst so a fresh mount happens per burst; the two never overlap
// in practice (ConfettiBurst's own DURATION_MS is well under
// BURST_INTERVAL_MS), but the key keeps a stray double-fire from reusing
// stale particle state regardless. Never under prefers-reduced-motion: the
// page stays fully reachable and readable, it just never renders a burst.
export function SecretPartyConfetti() {
  const reducedMotion = usePrefersReducedMotion();
  const [burst, setBurst] = useState<{ x: number; y: number; id: number } | null>(null);
  const nextIdRef = useRef(0);

  const fireBurst = useCallback(() => {
    nextIdRef.current += 1;
    setBurst({ x: window.innerWidth * (0.3 + Math.random() * 0.4), y: window.innerHeight * 0.3, id: nextIdRef.current });
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    // The first burst is deferred a frame rather than fired synchronously
    // in the effect body (react-hooks/set-state-in-effect) — same fix
    // AnimatedFigure.tsx uses for its own mount-triggered setState.
    const startFrame = requestAnimationFrame(fireBurst);
    const interval = setInterval(fireBurst, BURST_INTERVAL_MS);
    return () => {
      cancelAnimationFrame(startFrame);
      clearInterval(interval);
    };
  }, [reducedMotion, fireBurst]);

  const handleDone = useCallback(() => setBurst(null), []);

  if (!burst) return null;
  return <ConfettiBurst key={burst.id} originX={burst.x} originY={burst.y} onDone={handleDone} />;
}

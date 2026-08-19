"use client";

import { useEffect, useRef, useState } from "react";

const COUNT_DURATION_MS = 1200;

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

// Shared by every row of figures that counts up once scrolled into view —
// HomeKpis' five KPI tiles and EventsNetwork's three network figures, both
// via this one implementation rather than two copies of the same effect
// (board brief, 2026-08-20, when the second usage was added). A single
// IntersectionObserver per row, owned by that row's own component, not a
// shared observer across rows: docs/design-system.md's "one orchestrated
// moment beats ten scattered effects" is about not scattering effects
// *within* one moment, not about there only ever being one counting row on
// a page — HomeKpis' five tiles start together because they share one
// useSeenOnce call, and EventsNetwork's three do the same independently.
//
// `seen` only ever flips false→true: once a row has been scrolled past,
// scrolling back up must not restart it. Undefined IntersectionObserver (no
// browser support) degrades to "never seen" — the figures stay at their
// server-rendered final value forever, the same safe fallback a
// reduced-motion reader gets deliberately.
export function useSeenOnce<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (seen || typeof IntersectionObserver === "undefined") return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);

  return [ref, seen];
}

// Starts at `target` — the exact string the server rendered, and what a
// no-JS or reduced-motion reader keeps forever — so there is never a
// hydration mismatch and never a moment with no number at all. Counting
// only ever begins once `start` flips true (the row's own useSeenOnce): a
// plain requestAnimationFrame loop, timed against a value read once when the
// loop starts, not a recurring external clock — the useNow.ts bug this
// project already hit came from a clock read inside useSyncExternalStore's
// getSnapshot, which this isn't.
export function AnimatedFigure({
  target,
  start,
  reducedMotion,
  format,
}: {
  target: number;
  start: boolean;
  reducedMotion: boolean;
  format: (value: number) => string;
}) {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (!start || reducedMotion) return;
    let frame: number;
    const startTime = performance.now();
    // No separate setDisplay(0) here — the first requestAnimationFrame
    // callback below computes progress ≈ 0 on its own and sets the same
    // value through the one code path every later frame also uses, rather
    // than a synchronous setState call directly in the effect body
    // (react-hooks/set-state-in-effect).
    function tick(now: number) {
      const progress = Math.min((now - startTime) / COUNT_DURATION_MS, 1);
      if (progress < 1) {
        setDisplay(Math.round(target * easeOutCubic(progress)));
        frame = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, reducedMotion, target]);

  return <span className="tabular-nums">{format(display)}</span>;
}

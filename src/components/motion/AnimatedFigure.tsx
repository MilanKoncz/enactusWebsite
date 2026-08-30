"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

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

// Renders `target` — the exact string the server rendered, and what a
// no-JS or reduced-motion reader keeps forever — so there is never a
// hydration mismatch and never a moment with no number at all. That text is
// static from React's point of view: once mounted, the animation is driven
// entirely by direct DOM writes to the ref below, never by re-rendering
// this component, which is what closes the gap a previous version of this
// component had.
//
// That previous version drove the count via `useState` + a regular
// `useEffect`. The bug it produced: `start` flips true asynchronously,
// inside the IntersectionObserver callback in useSeenOnce, on its own
// schedule relative to the browser's paint loop. React commits that state
// change and the browser can paint the resulting frame — still showing the
// unchanged, target-valued text — before this component's effect has even
// run, let alone before its first requestAnimationFrame callback has fired.
// Under a throttled CPU (or just an unlucky frame), that gap widens enough
// to see: scroll the row into view, the number sits at its final value for
// a beat, then the count-up visibly starts from a lower value. A
// `useLayoutEffect` closes exactly that gap: it flushes synchronously after
// React commits the DOM change that makes the row's "seen" state visible,
// but *before* the browser paints that frame — so the direct write to
// `format(0)` below lands in the same frame `start` becoming true does, and
// there is no frame left in which the final value could be seen sitting
// still. The counting loop then keeps writing to the same node directly,
// on the browser's own requestAnimationFrame schedule, timed against a
// value read once when the loop starts — not a recurring external clock,
// the useNow.ts bug this project already hit came from a clock read inside
// useSyncExternalStore's getSnapshot, which this isn't.
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
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!start || reducedMotion) return;
    const node = ref.current;
    if (!node) return;

    node.textContent = format(0);

    let frame: number;
    const startTime = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - startTime) / COUNT_DURATION_MS, 1);
      node!.textContent = format(progress < 1 ? Math.round(target * easeOutCubic(progress)) : target);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // `format` deliberately excluded: every call site passes a fresh inline
    // closure each render, and it is only ever a formatting function over
    // `target` — including it would restart the animation, and sometimes
    // the frame-0 reset, on every unrelated parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, reducedMotion, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(target)}
    </span>
  );
}

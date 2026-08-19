"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";

export type ProximityGroupProps = {
  children: ReactNode;
  className?: string;
};

type CardCenter = {
  element: HTMLElement;
  x: number;
  y: number;
};

// How far from a card's center the pointer still nudges it, as a multiple of
// that card's own width — derived from the grid's actual layout rather than
// a fixed pixel constant, so "the neighbors react abgeschwächt" holds
// whether the grid is five columns wide (desktop) or three (a narrower
// hover-capable window).
const RADIUS_FACTOR = 1.6;

// One pointermove listener on the container, not one per card: it only ever
// writes the pointer position into a ref and asks for a single
// requestAnimationFrame callback. All --proximity writes for a given frame
// happen inside that one callback, so a mouse sweep across the grid touches
// the DOM at most once per animation frame — never once per mousemove event,
// and never through React state or a re-render.
export function ProximityGroup({ children, className }: ProximityGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const centersRef = useRef<CardCenter[]>([]);
  const containerRectRef = useRef<DOMRect | null>(null);
  const radiusRef = useRef(0);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef<number | null>(null);

  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const hoverCapable = useMediaQuery("(hover: hover) and (pointer: fine)");

  useEffect(() => {
    const container = containerRef.current;
    // Touch and reduced-motion visitors never get a listener at all — not
    // just a listener that happens to write 0. That's the first of two
    // independent gates; the second is the identical media query guarding
    // .proximity-item's transform/filter rules in globals.css, so even a
    // listener that somehow ran anyway couldn't move anything on those
    // devices.
    if (!container || reducedMotion || !hoverCapable) return;

    function measure() {
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      containerRectRef.current = containerRect;
      const cards = Array.from(container.children) as HTMLElement[];
      centersRef.current = cards.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element,
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        };
      });
      radiusRef.current = cards[0] ? cards[0].getBoundingClientRect().width * RADIUS_FACTOR : 0;
    }

    // Reads and writes never interleave within a frame: applyProximity only
    // reads from refs (already-cached geometry, no DOM) and only writes
    // style properties — no layout thrashing regardless of how many cards
    // there are.
    function applyProximity() {
      frameRef.current = null;
      const pointer = pointerRef.current;
      const radius = radiusRef.current;
      for (const { element, x, y } of centersRef.current) {
        const proximity =
          pointer && radius > 0
            ? Math.max(0, 1 - Math.hypot(pointer.x - x, pointer.y - y) / radius)
            : 0;
        element.style.setProperty("--proximity", String(proximity));
      }
    }

    function requestFrame() {
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(applyProximity);
    }

    function handlePointerMove(event: PointerEvent) {
      // No DOM read here: the container's rect is cached by measure() and
      // only ever refreshed on mount or resize, so a pointermove event
      // (which can fire dozens of times a second) costs nothing but a
      // subtraction.
      const rect = containerRectRef.current;
      if (!rect) return;
      pointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      requestFrame();
    }

    function handlePointerLeave() {
      pointerRef.current = null;
      requestFrame();
    }

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);

    // getBoundingClientRect() is viewport-relative, not document-relative —
    // it only reflects the container's position at the moment it's called.
    // ResizeObserver alone leaves it stale the instant the page scrolls
    // after mount, which for a section that starts below the fold (true of
    // every ProximityGroup on this site) is effectively always: the cached
    // rect from mount time no longer lines up with a pointermove event's
    // own (also viewport-relative) coordinates, so every proximity
    // calculation compares against the wrong position and silently stays at
    // 0. rAF-throttled the same way applyProximity already is — a bare
    // `scroll` listener can fire many times faster than the frame rate, and
    // re-measuring every direct child on each one would be real layout
    // thrashing during a fast scroll gesture.
    let scrollFrame: number | null = null;
    function handleScroll() {
      if (scrollFrame !== null) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = null;
        measure();
      });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      for (const { element } of centersRef.current) {
        element.style.removeProperty("--proximity");
      }
      centersRef.current = [];
    };
  }, [reducedMotion, hoverCapable]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

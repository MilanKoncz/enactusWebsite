"use client";

import { useCallback, useRef, useState } from "react";
import { Logo, type LogoProps } from "@/components/layout/Logo";
import { ConfettiBurst } from "@/components/motion/ConfettiBurst";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

// Easter egg 2/7 (docs/eastereggs.md). Three clicks on the hero logo within
// TRIPLE_CLICK_WINDOW_MS trigger a short confetti burst in the brand colors.
// Purely visual, no state change survives it — nothing here is saved,
// announced, or reflected anywhere else on the page.
const TRIPLE_CLICK_WINDOW_MS = 2000;

export type HeroLogoConfettiProps = LogoProps;

// The logo itself stays a plain <Image> — no button role, no tabIndex, no
// change to the page's tab order (CLAUDE.md brief). onClick on a
// non-interactive element only matters to a mouse/touch user here, which is
// exactly the intended audience for a hidden bonus like this one; nothing
// about keyboard operation changes because nothing keyboard-operable was
// added. The wrapping <span> carries the click handler and the size/shape
// query for the burst's origin point — className (the hero's responsive
// h-20/sm:h-32/md:h-40/lg:h-48 sizing) passes straight through to Logo
// itself, not the span, since a span's own height doesn't propagate down to
// an <img> child; the span stays `inline-block` so it hugs the logo's own
// box exactly, which is what makes getBoundingClientRect() below return the
// logo's real rendered position instead of some unrelated inline box.
export function HeroLogoConfetti({ className, ...logoProps }: HeroLogoConfettiProps) {
  const reducedMotion = usePrefersReducedMotion();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const clickCountRef = useRef(0);
  const lastClickAtRef = useRef(0);
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);

  const handleDone = useCallback(() => setBurst(null), []);

  const handleClick = useCallback(() => {
    // Under reduced motion this is inert entirely — not a reduced-motion
    // variant of the effect, no effect at all (CLAUDE.md brief).
    if (reducedMotion) return;

    const now = Date.now();
    clickCountRef.current = now - lastClickAtRef.current > TRIPLE_CLICK_WINDOW_MS ? 1 : clickCountRef.current + 1;
    lastClickAtRef.current = now;

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (rect) {
        setBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    }
  }, [reducedMotion]);

  return (
    <span ref={wrapperRef} onClick={handleClick} className="inline-block">
      <Logo {...logoProps} className={className} />
      {burst && <ConfettiBurst originX={burst.x} originY={burst.y} onDone={handleDone} />}
    </span>
  );
}

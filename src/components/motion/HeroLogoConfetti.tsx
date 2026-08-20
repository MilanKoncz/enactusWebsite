"use client";

import { useCallback, useRef, useState } from "react";
import { Logo, type LogoProps } from "@/components/layout/Logo";
import { ConfettiBurst } from "@/components/motion/ConfettiBurst";
import { cn } from "@/lib/cn";
import { useNow } from "@/lib/useNow";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

// Easter egg 2/7 (docs/eastereggs.md). Three clicks on the hero logo within
// TRIPLE_CLICK_WINDOW_MS trigger a short confetti burst in the brand colors.
// Purely visual, no state change survives it — nothing here is saved,
// announced, or reflected anywhere else on the page.
const TRIPLE_CLICK_WINDOW_MS = 2000;

// Easter egg 6/7: between 22:00 and 06:00 local time, a small zzZ sequence
// appears next to the logo, as if it were asleep. NIGHT_START/NIGHT_END are
// hours-of-day (0-23), wrapping past midnight.
const NIGHT_START_HOUR = 22;
const NIGHT_END_HOUR = 6;

function isNightHour(date: Date): boolean {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

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
// an <img> child; the span stays `inline-block` (plus `relative`, purely so
// the night-mode zzZ below can position against it) so it hugs the logo's
// own box exactly, which is what makes getBoundingClientRect() below return
// the logo's real rendered position instead of some unrelated inline box.
export function HeroLogoConfetti({ className, surface = "paper", ...logoProps }: HeroLogoConfettiProps) {
  const reducedMotion = usePrefersReducedMotion();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const clickCountRef = useRef(0);
  const lastClickAtRef = useRef(0);
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);

  // Checked once a minute, not every second — the display only ever needs
  // to catch a change of night/day state, not tick visibly. Reuses useNow
  // rather than a new interval hook (see its own file comment for the
  // useSyncExternalStore infinite-loop bug that shape once caused here).
  // The server and first client render both see now === 0 (useNow's
  // documented epoch snapshot), so `now > 0` below is what keeps this
  // effect fully absent until the client has confirmed a real clock reading
  // — never a frozen build-time value, never a hydration mismatch.
  const now = useNow(60_000);
  const isNight = now > 0 && isNightHour(new Date(now));

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
    <span ref={wrapperRef} onClick={handleClick} className="relative inline-block">
      <Logo {...logoProps} surface={surface} className={className} />
      {burst && <ConfettiBurst originX={burst.x} originY={burst.y} onDone={handleDone} />}
      {/* Absolutely positioned, so it can never affect the logo's own box or
          layout — the brief's explicit requirement that nothing may shift
          once this appears after mount. Purely decorative and never in the
          reading order: aria-hidden, and never rendered at all under
          reduced motion. */}
      {isNight && !reducedMotion && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-1 -right-1 select-none font-mono",
            // Gold as a text color is only legible on ink (docs/design-system.md)
            // — this component only ever runs surface="ink" in practice (the
            // homepage hero), but a future paper caller falls back to
            // inherited text color rather than an illegible gold.
            surface === "ink" ? "text-gold" : "text-current",
          )}
        >
          <span className="absolute top-0 right-0 animate-zzz-float text-mono-xs" style={{ animationDelay: "0s" }}>
            z
          </span>
          <span className="absolute top-1 right-2 animate-zzz-float text-mono-s" style={{ animationDelay: "0.6s" }}>
            Z
          </span>
          <span className="absolute top-2 right-4 animate-zzz-float text-mono-xs" style={{ animationDelay: "1.2s" }}>
            z
          </span>
        </span>
      )}
    </span>
  );
}

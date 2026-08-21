"use client";

import { cn } from "@/lib/cn";
import { useNow } from "@/lib/useNow";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

// Easter egg 6/7 (docs/eastereggs.md): between 22:00 and 06:00 local time, a
// small zzZ sequence appears next to the header logo — present on every
// page, not just the homepage hero — as if it were asleep. NIGHT_START/
// NIGHT_END are hours-of-day (0-23), wrapping past midnight.
const NIGHT_START_HOUR = 22;
const NIGHT_END_HOUR = 6;

function isNightHour(date: Date): boolean {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

export type NightModeZzzProps = {
  /** Which surface the logo it sits beside is on — same vocabulary as
      Logo's own `surface` prop. Gold as a text color is only legible on ink
      (docs/design-system.md); on paper this falls back to inherited text
      color instead. */
  surface?: "paper" | "ink";
  className?: string;
};

// The caller is responsible for `position: relative` on the element this is
// placed inside (or a positioned ancestor) — this itself is always
// `absolute`, so it can never affect that element's own box or layout:
// nothing may shift once this appears after mount. Purely decorative and
// never in the reading order: aria-hidden, and never rendered at all under
// reduced motion or before the client has confirmed a real clock reading.
export function NightModeZzz({ surface = "paper", className }: NightModeZzzProps) {
  const reducedMotion = usePrefersReducedMotion();

  // Checked once a minute, not every second — this only ever needs to catch
  // a change of night/day state, not tick visibly. Reuses useNow rather
  // than a new interval hook (see its own file comment for the
  // useSyncExternalStore infinite-loop bug that shape once caused here).
  // The server and first client render both see now === 0 (useNow's
  // documented epoch snapshot), so `now > 0` below is what keeps this
  // component fully absent until the client has confirmed a real clock
  // reading — never a frozen build-time value, never a hydration mismatch.
  const now = useNow(60_000);
  const isNight = now > 0 && isNightHour(new Date(now));

  if (!isNight || reducedMotion) return null;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute select-none font-mono",
        surface === "ink" ? "text-gold" : "text-current",
        className,
      )}
    >
      <span className="absolute top-0 right-0 animate-zzz-float text-mono-s" style={{ animationDelay: "0s" }}>
        z
      </span>
      <span className="absolute top-1 right-3 animate-zzz-float text-mono-m" style={{ animationDelay: "0.6s" }}>
        Z
      </span>
      <span className="absolute top-3 right-5 animate-zzz-float text-mono-s" style={{ animationDelay: "1.2s" }}>
        z
      </span>
    </span>
  );
}

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeStatus = "active" | "spinoff" | "cancelled" | "paused";

export type BadgeProps = {
  status: BadgeStatus;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"span">, "children">;

// Intuitive per-status color (active green, spinoff gold, paused yellow,
// cancelled a muted red), but color is never the only signal: active and
// spinoff stay filled, paused and cancelled stay an outline, so the four
// states are still distinguishable without color perception. Contrast for
// every pair is verified in tests/unit/contrast.test.ts. Paused and
// cancelled read as muted amber/oxblood rather than a bright yellow/red —
// a saturated yellow or red text can't clear 4.5:1 against paper at all,
// so "intuitive color" and "passes AA" both bend toward the muted end of
// each hue, not the vivid one.
const STATUS_CLASSES: Record<BadgeStatus, string> = {
  active: "bg-moss text-paper",
  spinoff: "bg-gold text-ink",
  paused: "border border-amber/50 bg-transparent text-amber",
  cancelled: "border border-oxblood/40 bg-transparent text-oxblood",
};

// A barely-there lift only, no color change — the fill/outline pairing above
// already carries the status, so nothing about that should shift with the
// pointer. Badge itself is never focusable (it's a label, not a control), but
// group-hover/group-focus-within let it respond when a future consumer wraps
// it in a `group`-classed, actually-interactive card (docs/design-system.md's
// Interaction section: "focus gets the same quality as hover").
export function Badge({ status, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border-l-2 border-l-gold px-4 py-1 font-mono text-mono-xs uppercase transition-transform duration-[var(--duration-fast)] ease-signature hover:-translate-y-px group-hover:-translate-y-px group-focus-within:-translate-y-px",
        STATUS_CLASSES[status],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

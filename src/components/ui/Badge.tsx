import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeStatus = "active" | "spinoff" | "cancelled" | "paused";

export type BadgeProps = {
  status: BadgeStatus;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"span">, "children">;

// Fläche vs. outline keeps the four states distinguishable without relying on
// color perception. Contrast for every pair is verified in
// tests/unit/contrast.test.ts.
const STATUS_CLASSES: Record<BadgeStatus, string> = {
  active: "bg-ink text-paper",
  spinoff: "bg-gold text-ink",
  paused: "border border-ink/40 bg-transparent text-ink/60",
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

import type { ElementType } from "react";
import { cn } from "@/lib/cn";

export type GateMarkerVariant = "milestone" | "divider";

export type GateMarkerProps = {
  label: string;
  variant?: GateMarkerVariant;
  as?: ElementType;
  className?: string;
};

// The signature element: docs/design-system.md — "a 2px vertical gold rule
// with a mono uppercase label set against it. [...] One motif, carried
// consistently." The rule stays vertical in both variants; only the flex
// direction of the wrapper changes to reposition the label. `as` defaults
// to "div" (every existing usage) — a heading level is only needed where a
// GateMarker doubles as a section's actual heading (Pillars), so its label
// is reachable by heading navigation instead of being purely decorative.
export function GateMarker({ label, variant = "milestone", as = "div", className }: GateMarkerProps) {
  const Wrapper: ElementType = as;
  const isDivider = variant === "divider";
  return (
    <Wrapper className={cn("flex items-center gap-3", isDivider ? "mx-auto flex-col" : "flex-row", className)}>
      <span
        aria-hidden="true"
        className={cn("w-[2px] bg-gold", isDivider ? "h-8" : "min-h-8 self-stretch")}
      />
      {/* currentColor, not a hardcoded ink, so this reads correctly on an
          ink-surfaced (dark) section too — same pattern as Eyebrow. The
          divider variant additionally paints its own surface behind the
          label: on the homepage the golden thread runs vertically through
          the exact centre of every gate stop, and without a backdrop it
          would cross the words. --surface-bg follows the enclosing
          Section's surface (globals.css), so this stays correct on ink. */}
      <span
        className={cn(
          "whitespace-nowrap font-mono text-mono-m uppercase",
          isDivider && "bg-[var(--surface-bg)] px-3",
        )}
      >
        {label}
      </span>
    </Wrapper>
  );
}

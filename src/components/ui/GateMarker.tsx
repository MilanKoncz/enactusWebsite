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
          // No whitespace-nowrap: every existing label is short enough to
          // stay on one line regardless, but /prozess's timeline (ProcessTimeline.tsx)
          // has titles ("Legal-Gating/Ausgründung") wider than the fixed
          // column they sit in ab lg — those need to wrap onto a second line
          // rather than overflow into the next station, and there's no
          // per-instance way to opt into wrapping from the outside (this
          // span's own className isn't exposed as a prop).
          // break-words is the fallback for a word overflow-wrap alone can't
          // place well (see [hyphens:auto] below); [hyphens:auto] relies on
          // the page's lang attribute (app/[locale]/layout.tsx) to hyphenate
          // at real German/English syllable boundaries first, which reads
          // far better than an arbitrary character-width break when a label
          // like "Legal-Gating/Ausgründung" has to wrap in a narrow column
          // (ProcessTimeline.tsx's ab-lg track).
          "break-words font-mono text-mono-m uppercase [hyphens:auto]",
          isDivider && "bg-[var(--surface-bg)] px-3 text-center",
        )}
      >
        {label}
      </span>
    </Wrapper>
  );
}

import { cn } from "@/lib/cn";

export type GateMarkerVariant = "milestone" | "divider";

export type GateMarkerProps = {
  label: string;
  variant?: GateMarkerVariant;
  className?: string;
};

// The signature element: docs/design-system.md — "a 2px vertical gold rule
// with a mono uppercase label set against it. [...] One motif, carried
// consistently." The rule stays vertical in both variants; only the flex
// direction of the wrapper changes to reposition the label.
export function GateMarker({ label, variant = "milestone", className }: GateMarkerProps) {
  const isDivider = variant === "divider";
  return (
    <div className={cn("flex items-center gap-3", isDivider ? "mx-auto flex-col" : "flex-row", className)}>
      <span
        aria-hidden="true"
        className={cn("w-[2px] bg-gold", isDivider ? "h-8" : "min-h-8 self-stretch")}
      />
      {/* currentColor, not a hardcoded ink, so this reads correctly on an
          ink-surfaced (dark) section too — same pattern as Eyebrow. */}
      <span className="whitespace-nowrap font-mono text-mono-s uppercase">{label}</span>
    </div>
  );
}

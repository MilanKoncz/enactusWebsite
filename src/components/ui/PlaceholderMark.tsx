import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PlaceholderMarkVariant = "missing" | "unverified";

export type PlaceholderMarkProps = {
  variant?: PlaceholderMarkVariant;
  hint: string;
  children: ReactNode;
  className?: string;
};

const VARIANT_CLASSES: Record<PlaceholderMarkVariant, string> = {
  // Data doesn't exist at all — the same dashed-gold language as the block
  // Placeholder component, so both read as one visual system
  // (docs/design-system.md: "one motif, carried consistently").
  missing: "inline-flex items-center rounded-sm border border-dashed border-gold px-1.5 py-0.5",
  // Data exists but hasn't been confirmed by the board yet — deliberately
  // quiet, so a page of real (if unverified) numbers doesn't read as
  // half-finished the way a page full of dashed boxes would.
  unverified: "border-b border-dotted border-gold",
};

// Two placeholder states, not one: `missing` marks a fact that doesn't
// exist yet (a name, a logo), `unverified` marks a fact that exists but
// hasn't been confirmed (a KPI value). Gold is a border in both, never a
// text color — the one contrast rule with no exceptions
// (docs/design-system.md). `hint` doubles as a mouse tooltip (`title`) and,
// appended as visually-hidden text, the reason a screen reader user hears
// for content that otherwise looks like a normal word or number.
export function PlaceholderMark({ variant = "missing", hint, children, className }: PlaceholderMarkProps) {
  return (
    <span title={hint} className={cn(VARIANT_CLASSES[variant], className)}>
      {children}
      <span className="sr-only"> — {hint}</span>
    </span>
  );
}

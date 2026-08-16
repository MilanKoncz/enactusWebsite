import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type CardInteraction = "lift" | "grow";

export type CardProps = {
  /** "lift" is the design system's default card response (a 1px rise plus a
      brightening border). "grow" is for the cards that used to reveal text
      on hover: a slight scale and nothing else — see .hover-grow. */
  interaction?: CardInteraction;
} & ComponentPropsWithoutRef<"div">;

// Defined by its border, not by a fill: the card always sits on a section
// that already paints the same surface, so an opaque background was a no-op
// visually — except that it hid the golden thread wherever the two overlap,
// which below `lg` is most of the Benefits grid. The thread now passes
// behind the card the same way it passes behind the board portraits.
//
// Same lift as Button (docs/design-system.md's Interaction section), plus the
// border brightening — nothing else moves, so a card full of text never
// shifts its own content on hover/focus. Cards that render tabIndex={0}
// (Benefits.tsx) get the hover treatment on :focus-visible too, for the same
// reason Button does: focus is never a lesser state than hover.
const INTERACTION: Record<CardInteraction, string> = {
  lift: "transition-[border-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:border-ink/20 focus-visible:-translate-y-px focus-visible:border-ink/20",
  grow: "hover-grow",
};

export function Card({ interaction = "lift", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-md border border-ink/10 p-6", INTERACTION[interaction], className)}
      {...props}
    >
      {children}
    </div>
  );
}

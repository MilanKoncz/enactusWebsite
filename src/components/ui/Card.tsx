import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type CardProps = ComponentPropsWithoutRef<"div">;

// Same lift as Button (docs/design-system.md's Interaction section), plus the
// border brightening — nothing else moves, so a card full of text never
// shifts its own content on hover/focus. Cards that render tabIndex={0}
// (Benefits.tsx) get the hover treatment on :focus-visible too, for the same
// reason Button does: focus is never a lesser state than hover.
//
// Defined by its border, not by a fill: the card always sits on a section
// that already paints the same surface, so an opaque background was a no-op
// visually — except that it hid the golden thread wherever the two overlap,
// which below `lg` is most of the Benefits grid. The thread now passes
// behind the card the same way it passes behind the board portraits.
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-ink/10 p-6 transition-[border-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:border-ink/20 focus-visible:-translate-y-px focus-visible:border-ink/20",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

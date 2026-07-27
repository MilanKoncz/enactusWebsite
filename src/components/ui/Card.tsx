import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type CardProps = ComponentPropsWithoutRef<"div">;

// Same lift as Button (docs/design-system.md's Interaction section), plus the
// border brightening — nothing else moves, so a card full of text never
// shifts its own content on hover/focus. Cards that render tabIndex={0}
// (Benefits.tsx) get the hover treatment on :focus-visible too, for the same
// reason Button does: focus is never a lesser state than hover.
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-ink/10 bg-paper p-6 transition-[border-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:border-ink/20 focus-visible:-translate-y-px focus-visible:border-ink/20",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

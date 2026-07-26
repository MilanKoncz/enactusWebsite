import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type RevealProps = {
  children: ReactNode;
  className?: string;
};

// Thin wrapper around the `.reveal` utility (src/app/globals.css) — kept as
// a component rather than a bare className so call sites read as "this
// enters on scroll" instead of an opaque utility name, and so the
// CSS-vs-JavaScript decision (docs/design-system.md: "CSS first") lives in
// one place. No JavaScript here: the entrance is a CSS scroll-driven
// animation behind @supports, so content is fully visible by default and
// only ever enhanced, never hidden, on browsers or motion preferences that
// don't support it.
export function Reveal({ children, className }: RevealProps) {
  return <div className={cn("reveal", className)}>{children}</div>;
}

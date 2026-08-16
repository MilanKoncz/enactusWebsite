import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DetailTextProps = {
  children: ReactNode;
  className?: string;
};

// The supporting sentence under a pillar, a benefit, or a /mitmachen
// expectation. Always visible, on every device — it used to fade in on
// hover at desktop widths, which meant most of the traffic (Instagram, on a
// phone) could see it while desktop visitors could not, and it put real
// content behind a gesture the design system rules out. The box it sits in
// carries `hover-grow` (globals.css) instead: hover now grows the box
// slightly and reveals nothing.
//
// Muted rather than hidden: 60% of ink on paper, the floor
// docs/design-system.md sets for secondary text.
export function DetailText({ children, className }: DetailTextProps) {
  return <p className={cn("text-body-m opacity-60", className)}>{children}</p>;
}

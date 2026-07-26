import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type HoverDetailProps = {
  children: ReactNode;
  className?: string;
};

// The detail text is present in the DOM and the accessibility tree
// unconditionally — this only ever toggles opacity, never display or
// aria-hidden, so a screen reader always reads it regardless of hover/focus
// state. Visually, it's always shown (mobile, touch, small screens) except
// on a hover-capable device at md+ width (desktop-hover, globals.css), where
// it starts hidden and reveals on `group-hover` or `group-focus-within` —
// hover and keyboard focus are equivalent triggers (WCAG 1.4.13), which is
// why the parent column needs `className="group" tabIndex={0}`, not just
// `group`, to make it keyboard-reachable at all.
export function HoverDetail({ children, className }: HoverDetailProps) {
  return (
    <p
      className={cn(
        "text-body-m opacity-60 transition-opacity duration-200",
        "desktop-hover:opacity-0 desktop-hover:group-hover:opacity-100 desktop-hover:group-focus-within:opacity-100",
        className,
      )}
    >
      {children}
    </p>
  );
}

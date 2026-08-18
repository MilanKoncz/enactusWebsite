import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type SectionSurface = "paper" | "ink";

export type SectionProps = {
  surface?: SectionSurface;
} & ComponentPropsWithoutRef<"section">;

// data-surface="ink" is what globals.css keys the focus-ring color off of —
// see [data-surface="ink"] in @theme's base layer.
export function Section({ surface = "paper", className, children, ...props }: SectionProps) {
  return (
    <section
      data-surface={surface === "ink" ? "ink" : undefined}
      className={cn(
        // Smaller on mobile than the desktop rhythm (py-24) — one section
        // after another at a full 96px top and bottom reads as generous on
        // a 1280px screen and as excessive scrolling on a 360px one. This
        // is also the single place the vertical rhythm is set, so every
        // section that doesn't override it moves together.
        "py-16 md:py-24",
        surface === "ink" ? "bg-ink text-paper" : "bg-paper text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

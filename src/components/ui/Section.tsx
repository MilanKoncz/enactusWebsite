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
        "py-24",
        surface === "ink" ? "bg-ink text-paper" : "bg-paper text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

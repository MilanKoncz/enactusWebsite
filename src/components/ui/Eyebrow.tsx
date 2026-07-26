import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type EyebrowProps = ComponentPropsWithoutRef<"p">;

// opacity-60 on `currentColor` clears 4.5:1 against both --color-paper and
// --color-ink (verified in tests/unit/contrast.test.ts), so this works
// unchanged inside a paper- or ink-surfaced Section.
export function Eyebrow({ className, children, ...props }: EyebrowProps) {
  return (
    <p className={cn("font-mono text-mono-s uppercase opacity-60", className)} {...props}>
      {children}
    </p>
  );
}

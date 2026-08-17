import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Eyebrow } from "./Eyebrow";

export type SectionHeadingProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
};

// The eyebrow + heading + optional lead-sentence combination repeats across
// most homepage sections. Surface-agnostic like Eyebrow and GateMarker — no
// hardcoded ink/paper color, so it reads correctly on either Section
// surface. `as` defaults to "h2": a page has exactly one h1, and that's the
// hero's, not a section heading's.
export function SectionHeading({ eyebrow, title, lead, as = "h2", className }: SectionHeadingProps) {
  const Heading: ElementType = as;
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      {/* `break-words` only takes effect for a word that cannot fit its line
          at all, so it changes nothing for headings that already fit — but
          German compounds set at display size do overflow 360px on their
          own ("Bewerbungsfenster" needs 371px in a 328px column), and an
          overflowing heading pushes the whole document sideways, which the
          quality floor in CLAUDE.md rules out. */}
      <Heading className="text-display-3 font-display break-words">{title}</Heading>
      {lead && <p className="text-body-l">{lead}</p>}
    </div>
  );
}

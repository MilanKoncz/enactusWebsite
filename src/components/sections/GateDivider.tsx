import { Container } from "@/components/ui/Container";
import { GateMarker } from "@/components/ui/GateMarker";
import { Section } from "@/components/ui/Section";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import type { ThreadStop } from "@/components/motion/threadRoute";
import { cn } from "@/lib/cn";

type LabelledDivider = {
  label: string;
  /** Optional: renders the golden thread through this divider, vertical and
      centered on it (threadRoute.ts keeps every gate stop at x=50, exactly
      where GateMarker's centered divider rule already sits) — the thread
      becomes the gate rule for a moment instead of running beside it. Omit
      it and the divider renders exactly as before. */
  stop?: ThreadStop;
};

/** A divider with no label is only a seam in the thread's run, so it has to
    carry the thread — without it there would be nothing to render at all. */
type BareDivider = {
  label?: undefined;
  stop: ThreadStop;
};

export type GateDividerProps = LabelledDivider | BareDivider;

// Only ever placed inside a light run of the page — a surface change is
// already a seam, so this divider never sits at one (docs/design-system.md:
// the gate marker as the divider between major homepage sections).
//
// A bare divider (no label — only "gate-kpis" today) renders no visible
// content of its own, just the thread passing through in a short straight
// line: its only job is to be a seam, not to occupy a section's worth of
// space. Giving it the same py-10 md:py-16 as a labelled gate stacked an
// extra 5-8rem of empty space on top of PartnerMarquee's own bottom padding
// and HomeKpis's own top padding — the page's most visible whitespace gap.
// A labelled divider keeps the taller padding: its GateMarker is real
// content that needs room to breathe.
export function GateDivider({ label, stop }: GateDividerProps) {
  return (
    <Section className={cn("relative isolate", label ? "py-10 md:py-16" : "py-4 md:py-6")}>
      {stop && <ThreadSegment stop={stop} />}
      {label && (
        <Container className="relative">
          <GateMarker label={label} variant="divider" />
        </Container>
      )}
    </Section>
  );
}

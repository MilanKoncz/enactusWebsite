import { Container } from "@/components/ui/Container";
import { GateMarker } from "@/components/ui/GateMarker";
import { Section } from "@/components/ui/Section";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import type { ThreadStop } from "@/components/motion/threadRoute";

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
export function GateDivider({ label, stop }: GateDividerProps) {
  return (
    <Section className="relative isolate py-10 md:py-16">
      {stop && <ThreadSegment stop={stop} />}
      {label && (
        <Container className="relative">
          <GateMarker label={label} variant="divider" />
        </Container>
      )}
    </Section>
  );
}

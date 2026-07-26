import { Container } from "@/components/ui/Container";
import { GateMarker } from "@/components/ui/GateMarker";
import { Section } from "@/components/ui/Section";

export type GateDividerProps = {
  label: string;
};

// Only ever placed inside a light run of the page — a surface change is
// already a seam, so this divider never sits at one (docs/design-system.md:
// the gate marker as the divider between major homepage sections).
export function GateDivider({ label }: GateDividerProps) {
  return (
    <Section className="py-16">
      <Container>
        <GateMarker label={label} variant="divider" />
      </Container>
    </Section>
  );
}

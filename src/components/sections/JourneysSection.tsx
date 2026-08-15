import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { trips } from "@/content/journeys";

// "FSS"/"HWS" are the University of Mannheim's own semester abbreviations
// (Frühjahrs-/Sommersemester, Herbst-/Wintersemester) — derived from each
// trip's key rather than stored as a separate field, so the two can never
// drift apart, and left untranslated on the English route for the same
// reason CLAUDE.md keeps the Impressum's legal terms in German: they're this
// institution's own vocabulary, not a translatable description.
function seasonLabel(key: string): string {
  return key.split("-")[0].toUpperCase();
}

// A horizontal history on a wide screen (grid-cols-4), stacking on a narrow
// one — the vertical gold rule per entry reuses the gate-marker motif
// (docs/design-system.md: "one motif, carried consistently") rather than
// introducing a second timeline visual next to ProcessTimeline's.
export function JourneysSection() {
  const t = useTranslations("JourneysSection");

  return (
    <Section className="relative isolate">
      <ThreadSegment stop="events-journeys" />
      <Container className="relative flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {trips.map((trip) => (
            <li key={trip.key} className="border-l-2 border-gold py-1 pl-4">
              <p className="font-mono text-mono-xs uppercase opacity-60">
                {seasonLabel(trip.key)} {trip.year}
              </p>
              <p className="text-body-l font-medium">{trip.destination}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

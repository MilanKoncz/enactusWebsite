import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
    <Section surface="ink" className="relative isolate corner-glow">
      <Container className="relative flex flex-col gap-10">
        {/* max-w-lg: kept for plain layout tidiness (an unconstrained lead
            paragraph reads too wide on a big screen), not for gradient
            contrast the way it was under .signature-gradient (moved off
            2026-08-25 to .corner-glow — see that utility's own comment in
            globals.css). .corner-glow's base is solid ink everywhere; the
            glow itself never gets bright enough to threaten text contrast,
            so nothing here needs to be bounded to stay inside a safe zone
            the way it did before. surface="ink" above gives the section
            (and this currentColor-based heading) paper as its base text
            color, and Eyebrow's own opacity-60 is already verified against
            a flat ink background in tests/unit/contrast.test.ts. */}
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
          className="max-w-lg self-start"
        />
        <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {trips.map((trip) => (
            // Ink fill + the gate-marker's left gold rule (not a new
            // full-border motif) — a dark card on the gradient rather than
            // the old opaque bg-paper block. Opaque on purpose: unlike the
            // heading above, these cards aren't width-bounded (the grid
            // fills the full row from `sm` up), so they can land anywhere
            // across the section without ever needing to justify their own
            // contrast against whatever's behind them.
            <li key={trip.key} className="border-l-2 border-gold bg-ink px-4 py-3">
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

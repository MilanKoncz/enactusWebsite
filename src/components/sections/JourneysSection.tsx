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
    <Section surface="ink" className="relative isolate signature-gradient">
      <Container className="relative flex flex-col gap-10">
        {/* max-w-lg: the heading sits directly on the gradient now (no
            opaque card, per the board's 2026-08-19 follow-up), in paper —
            see .signature-gradient's comment in globals.css for the stop
            weighting this width is bounded to stay inside. surface="ink"
            above gives the section (and this currentColor-based heading)
            paper as its base text color, and Eyebrow's own opacity-60 is
            already verified against a flat ink background in
            tests/unit/contrast.test.ts.

            Box-width arithmetic .signature-gradient's comment refers to:
            below `sm` the lead paragraph doesn't fit on one line, and a
            wrapped block's shrink-to-fit width fills essentially the whole
            available column regardless of max-w-lg (512px never binds
            below ~600px of available space) — measured with Playwright,
            the heading block's right edge lands at 95.6% of the section
            width at a 360px viewport and 95.9% at 390px. From `md` up
            (768px container, 1280px container) max-w-lg actually binds,
            and the block's right edge falls back to 69.8% / 43.1%. All
            four are asserted against the gradient's real stops in
            tests/unit/contrast.test.ts. */}
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
            // across the gradient, including the gold end, without ever
            // needing to justify their own contrast against it.
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

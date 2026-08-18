import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { GateMarker } from "@/components/ui/GateMarker";
import { DetailText } from "@/components/ui/DetailText";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { pillars, type PillarKey } from "@/content/pillars";

// How each pillar's background photo should fit its card — a presentation
// choice, not a fact about the organisation, so it stays out of
// content/pillars.ts (which the board maintains) and lives here next to
// PILLAR_OVERLAY_OPACITY instead. `esg`'s SDG wheel is a labelled infographic,
// not a texture: cropping it (object-cover) cuts an arbitrary arc out of the
// 17 goal colors that make it recognisable, and the scrim then sits on top of
// that arbitrary crop rather than a whole, legible wheel. object-contain
// keeps the whole wheel centered instead. The two photos stay object-cover,
// which is the right fit for an actual photograph. Typed against PillarKey,
// not a default case, so a fourth pillar fails to compile without an explicit
// entry here.
export const PILLAR_IMAGE_FIT: Record<PillarKey, "cover" | "contain"> = {
  esg: "contain",
  execution: "cover",
  network: "cover",
};

// Overlay strength for each pillar's background photo — a flat scrim rather
// than a gradient, so every pixel behind the text gets the same guarantee
// regardless of where the photo happens to be bright, and paper text over
// it never depends on which part of the crop sits behind which line. 0.85
// is a deliberate, measured choice, not a guess: tests/unit/contrast.test.ts
// blends ink at this exact opacity over a worst-case pure-white photo
// background and checks the result against both full-opacity paper text
// (the title) and DetailText's muted 60%-opacity paper text — the actual
// failure this was raised to fix. 0.75 passed the first check but not the
// second (3.97:1, short of AA's 4.5:1), which is exactly what made the
// ESG pillar's bright SDG-wheel photo read as competing with its own text
// instead of sitting calmly behind it. Two exports, not one: Tailwind's
// class scanner needs the literal "bg-ink/85" string somewhere in source (a
// template literal built from the numeric value below wouldn't be visible
// to it), while the test needs the plain number to feed the contrast
// formula — keep both in sync by hand if this ever changes.
export const PILLAR_OVERLAY_OPACITY_CLASS = "bg-ink/85";
export const PILLAR_OVERLAY_OPACITY = 0.85;

// Board decision, 2026-08-18: back to a hover/focus reveal for this section
// specifically (docs/design-system.md's "hover enhances, hover never hides"
// still governs benefits and /mitmachen, which keep the always-visible fix —
// this is a named, scoped exception, not a reopening of that rule). At rest
// a desktop card now shows only its photo and heading; the lead sentence and
// detail line reveal on hover or keyboard focus (.pillar-detail in
// globals.css, transitioning over --duration-calm). Below `md`, with no
// hover to reveal it, the same text unfolds via a scroll-driven
// `animation-timeline: view()` animation instead, once the card reaches the
// viewport. Both paths keep the text permanently in the accessibility tree —
// only opacity/transform move, never `display`/`visibility` — and reduced
// motion shows it immediately and permanently on every width.
//
// `tabIndex={0}` on the column is what makes the reveal reachable without a
// pointer: without it, a keyboard user would have no way to trigger the
// hover-only state at all. The scroll entrance (Reveal) still wraps the
// whole three-column row, so it reads as one arrival, not three staggered
// ones. Each column doubles GateMarker as its own h3 — the gold rule and
// mono label carry the heading instead of a separate, larger one repeating
// the same two or three words right below it.
//
// Each column now carries its own background photo (content/pillars.ts),
// with the dark scrim above sitting between the photo and the text so
// paper-colored text stays legible regardless of the photo's own tones —
// board feedback asked for both the photo and an actually-measured
// contrast guarantee, not just an eyeballed overlay.
export function Pillars() {
  const t = useTranslations("Pillars");

  return (
    <Section surface="ink" className="relative isolate">
      <ThreadSegment stop="pillars" />
      <Container className="relative flex flex-col gap-12">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <Reveal className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.key}
              tabIndex={0}
              className="hover-grow group pillar-reveal-source relative isolate flex flex-col gap-4 overflow-hidden rounded-md bg-ink p-6"
            >
              {pillar.image && (
                <>
                  <Image
                    src={pillar.image}
                    alt=""
                    fill
                    className={PILLAR_IMAGE_FIT[pillar.key] === "contain" ? "object-contain" : "object-cover"}
                  />
                  <div aria-hidden="true" className={`absolute inset-0 ${PILLAR_OVERLAY_OPACITY_CLASS}`} />
                </>
              )}
              {/* Explicitly positioned, not just a later sibling: the photo
                  and scrim above are absolutely positioned, and an absolutely
                  positioned box paints after plain in-flow content at the
                  same stacking level regardless of DOM order — without this
                  wrapper the photo and scrim painted over the heading and
                  copy on all three cards, not only the one with a visibly
                  transparent image. `relative` puts this wrapper in the same
                  positioned bucket, where DOM order (this div comes after the
                  photo) decides the paint order instead. */}
              <div className="relative flex flex-col gap-4">
                <GateMarker as="h3" label={t(`${pillar.key}.title`)} />
                <div className="pillar-detail flex flex-col gap-4">
                  <p className="text-body-l">
                    {pillar.key === "esg"
                      ? t.rich("esg.lead", {
                          sdgLink: (chunks) => (
                            <a
                              href="https://sdgs.un.org/goals"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-underline"
                            >
                              {chunks}
                            </a>
                          ),
                        })
                      : t(`${pillar.key}.lead`)}
                  </p>
                  <DetailText>{t(`${pillar.key}.detail`)}</DetailText>
                </div>
              </div>
            </div>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}

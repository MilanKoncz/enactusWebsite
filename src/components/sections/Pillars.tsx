import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { GateMarker } from "@/components/ui/GateMarker";
import { DetailText } from "@/components/ui/DetailText";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { pillars } from "@/content/pillars";

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

// Title, lead, and the supporting detail sentence are all always visible.
// Hover grows the column slightly and does nothing else (.hover-grow in
// globals.css) — it used to fade the detail in, which hid real content from
// exactly the desktop visitors who could trigger it. The scroll entrance
// (Reveal) wraps the whole three-column row, so it reads as one arrival, not
// three staggered ones. Each column doubles GateMarker as its own h3 — the
// gold rule and mono label carry the heading instead of a separate, larger
// one repeating the same two or three words right below it.
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
              className="hover-grow relative isolate flex flex-col gap-4 overflow-hidden rounded-md p-6"
            >
              {pillar.image && (
                <>
                  <Image src={pillar.image} alt="" fill className="object-cover" />
                  <div aria-hidden="true" className={`absolute inset-0 ${PILLAR_OVERLAY_OPACITY_CLASS}`} />
                </>
              )}
              <GateMarker as="h3" label={t(`${pillar.key}.title`)} />
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
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}

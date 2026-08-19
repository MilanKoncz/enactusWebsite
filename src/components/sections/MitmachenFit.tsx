import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { GateMarker } from "@/components/ui/GateMarker";
import { DetailText } from "@/components/ui/DetailText";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { expectations, offers } from "@/content/mitmachenFit";

// Same always-visible detail text as Pillars.tsx and Benefits.tsx
// (DetailText), with hover growing the item slightly and revealing nothing
// (.hover-grow) — the brief is explicit that content here stays readable
// without interaction. "Agency" is defined
// inline, in its own `lead` sentence (never a link out — a conversion page
// doesn't send people away), the same way every other expectation states
// what it means without a glossary.
//
// The fit note directly below is deliberately its own visually distinct
// block, not a trailing caption: the brief calls it "prominent, not a
// footnote" specifically because a page that opens with two four-item lists
// of expectations reads as more demanding than intended without an equally
// weighted counter-note right after it.
export function MitmachenFit() {
  const t = useTranslations("MitmachenPage.fit");

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col gap-16">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <Reveal className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <h2 className="text-heading-2 font-display font-normal!">{t("expectationsHeading")}</h2>
            <div className="flex flex-col gap-6">
              {expectations.map((item) => (
                <div key={item.key} className="hover-grow flex flex-col gap-2 rounded-md p-2">
                  <GateMarker as="h3" label={t(`expectations.${item.key}.title`)} />
                  <p className="text-body-m">{t(`expectations.${item.key}.lead`)}</p>
                  <DetailText>{t(`expectations.${item.key}.detail`)}</DetailText>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-8">
            <h2 className="text-heading-2 font-display font-normal!">{t("offersHeading")}</h2>
            <div className="flex flex-col gap-6">
              {offers.map((item) => (
                <div key={item.key} className="hover-grow flex flex-col gap-2 rounded-md p-2">
                  <GateMarker as="h3" label={t(`offers.${item.key}.title`)} />
                  <p className="text-body-m">{t(`offers.${item.key}.lead`)}</p>
                  <DetailText>{t(`offers.${item.key}.detail`)}</DetailText>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <div className="rounded-md border-l-2 border-gold bg-gold/5 px-6 py-6 md:px-10 md:py-8">
          <p className="text-heading-3 font-display font-normal!">{t("fitNote.lead")}</p>
          <p className="mt-2 text-body-l opacity-80">{t("fitNote.detail")}</p>
        </div>
      </Container>
    </Section>
  );
}

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { DetailText } from "@/components/ui/DetailText";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { ToolOrbit } from "@/components/motion/ToolOrbit";
import { benefits } from "@/content/benefits";
import { tools } from "@/content/tools";

// Same always-visible detail text as Pillars (DetailText), denser grid, no
// gate marker — that motif belongs to the pillars, one signature element,
// not two competing ones on the same page. The cards no longer carry
// `tabIndex={0}`: that existed to make the hidden detail sentence
// keyboard-reachable, and a focus stop on a card that contains nothing
// interactive is only noise in the tab order now that the text is always
// there.
//
// The animated circle (ToolOrbit) is kept from `md` up — a real tablet, not
// just "not a phone" — and replaced below that by a static two-column grid
// of the same five logos: a decorative flourish is worth animating once
// there's room for it beside the cards, but on a phone it's worth keeping
// only as plain, unanimated information (board brief: "either drop it or
// reduce it to a static row on mobile").
export function Benefits() {
  const t = useTranslations("Benefits");

  return (
    <Section className="relative isolate">
      <ThreadSegment stop="benefits" />
      <Container className="relative flex flex-col gap-12">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <div className="grid grid-cols-2 gap-6 md:hidden" aria-hidden="true">
          {tools.map((toolItem) => (
            <div key={toolItem.key} className="relative h-14 w-full">
              <Image src={toolItem.logo} alt="" fill sizes="160px" className="object-contain" />
            </div>
          ))}
        </div>
        {/* The orbit is a sibling of the grid, not of the whole column: it
            centres against the cards themselves, so it reads as belonging to
            them instead of floating somewhere beside the section. */}
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:flex-1">
            {benefits.map((benefit) => (
              <Card key={benefit.key} interaction="grow" className="flex flex-col gap-3">
                <h3 className="text-heading-3 font-sans">{t(`${benefit.key}.title`)}</h3>
                <p className="text-body-m">{t(`${benefit.key}.lead`)}</p>
                <DetailText>{t(`${benefit.key}.detail`)}</DetailText>
              </Card>
            ))}
          </div>
          <div className="hidden shrink-0 md:block">
            <ToolOrbit />
          </div>
        </div>
      </Container>
    </Section>
  );
}

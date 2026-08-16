import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { DetailText } from "@/components/ui/DetailText";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { ToolOrbit } from "@/components/motion/ToolOrbit";
import { benefits } from "@/content/benefits";

// Same always-visible detail text as Pillars (DetailText), denser grid, no
// gate marker — that motif belongs to the pillars, one signature element,
// not two competing ones on the same page. The cards no longer carry
// `tabIndex={0}`: that existed to make the hidden detail sentence
// keyboard-reachable, and a focus stop on a card that contains nothing
// interactive is only noise in the tab order now that the text is always
// there.
//
// ToolOrbit sits beside the grid on large screens only (board feedback: a
// decorative flourish, not information — dropped below `lg` rather than
// squeezed into a cramped static row, per the brief's own "either drop it or
// reduce it to a static row on mobile" allowance).
export function Benefits() {
  const t = useTranslations("Benefits");

  return (
    <Section className="relative isolate">
      <ThreadSegment stop="benefits" />
      <Container className="relative flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex flex-col gap-12 lg:flex-1">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <Card key={benefit.key} interaction="grow" className="flex flex-col gap-3">
                <h3 className="text-heading-3 font-sans">{t(`${benefit.key}.title`)}</h3>
                <p className="text-body-m">{t(`${benefit.key}.lead`)}</p>
                <DetailText>{t(`${benefit.key}.detail`)}</DetailText>
              </Card>
            ))}
          </div>
        </div>
        <div className="hidden shrink-0 lg:block">
          <ToolOrbit />
        </div>
      </Container>
    </Section>
  );
}

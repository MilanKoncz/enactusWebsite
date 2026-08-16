import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { HoverDetail } from "@/components/ui/HoverDetail";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { benefits } from "@/content/benefits";

// Same hover/focus mechanic as Pillars (HoverDetail), denser grid, no gate
// marker — that motif belongs to the pillars, one signature element, not
// two competing ones on the same page.
export function Benefits() {
  const t = useTranslations("Benefits");

  return (
    <Section className="relative isolate">
      <ThreadSegment stop="benefits" />
      <Container className="relative flex flex-col gap-12">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <Card key={benefit.key} tabIndex={0} className="group flex flex-col gap-3">
              <h3 className="text-heading-3 font-sans">{t(`${benefit.key}.title`)}</h3>
              <p className="text-body-m">{t(`${benefit.key}.lead`)}</p>
              <HoverDetail>{t(`${benefit.key}.detail`)}</HoverDetail>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ThreadSegment } from "@/components/motion/ThreadSegment";

// /prozess has no hero, so this SectionHeading carries the page's one h1
// directly (SectionHeading defaults to h2, built for pages where a hero
// already owns the h1 — see its own comment). `lead` is a single sentence on
// purpose: the board's explicit complaint about the previous version of this
// page was too much running text before the timeline even started.
export function ProcessIntro() {
  const t = useTranslations("Process");

  return (
    <Section className="relative isolate">
      <ThreadSegment stop="process-intro" />
      <Container className="relative">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} lead={t("intro")} />
      </Container>
    </Section>
  );
}

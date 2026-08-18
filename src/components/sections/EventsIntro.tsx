import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

// /events has no hero, so this SectionHeading carries the page's one h1 —
// same reasoning as ProcessIntro.tsx / ProjectsIntro.tsx. The title is one
// sentence about the Enactus Germany/Global affiliation; the lead below it
// (added 2026-08-18) introduces the four format tiles that follow.
export function EventsIntro() {
  const t = useTranslations("EventsPage");

  return (
    <Section className="relative isolate">
      <Container className="relative">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
      </Container>
    </Section>
  );
}

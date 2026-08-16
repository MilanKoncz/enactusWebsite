import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

// /events has no hero, so this SectionHeading carries the page's one h1 —
// same reasoning as ProcessIntro.tsx / ProjectsIntro.tsx. The brief asks for
// exactly one sentence about the Enactus Germany/Global affiliation, so that
// sentence is the title itself rather than a title plus a separate lead.
export function EventsIntro() {
  const t = useTranslations("EventsPage");

  return (
    <Section className="relative isolate">
      <Container className="relative">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} />
      </Container>
    </Section>
  );
}

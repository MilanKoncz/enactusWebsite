import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

// /projekte has no hero, so this SectionHeading carries the page's one h1 —
// same reasoning as ProcessIntro.tsx. No `lead`: the brief gives one exact
// sentence for this page ("Kern unseres Vereins sind unsere Projekte."),
// which is the title itself, not a title plus a supporting lead sentence.
export function ProjectsIntro() {
  const t = useTranslations("ProjectsPage");

  return (
    <Section className="relative isolate">
      <Container className="relative">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} />
      </Container>
    </Section>
  );
}

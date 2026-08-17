import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonClasses } from "@/components/ui/Button";
import { org } from "@/content/org";

// A plain <a>, not Button's href branch — Button routes through next-intl's
// Link (lib/navigation.ts), built for internal app routes, and every
// existing mailto link in this codebase (Impressum.tsx,
// ProjectDetailContent.tsx) already avoids it for exactly that reason.
// buttonClasses gives it Button's exact primary/lg look without duplicating
// those classes by hand.
const MAILTO_BUTTON_CLASSES = buttonClasses("primary", "lg");

// The one dark section on this page (docs/design-system.md: dark sections
// punctuate) and the page's single clear contact path — every other section
// above (benefits, tiers, statements, membership) builds the case, this is
// where it resolves into one unambiguous action.
export function PartnerContact() {
  const t = useTranslations("PartnerPage.contact");

  return (
    <Section surface="ink" className="relative isolate border-b border-paper/10 py-36">
      <Container className="relative flex flex-col items-start gap-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <a href={`mailto:${org.contactEmails.board}`} className={MAILTO_BUTTON_CLASSES}>
          {t("cta")}
        </a>
      </Container>
    </Section>
  );
}

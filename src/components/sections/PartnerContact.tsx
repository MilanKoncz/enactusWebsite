import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ThreadSegment } from "@/components/motion/ThreadSegment";

const CONTACT_EMAIL = "teamvorstand@unimannheim.enactus.team";

// A plain <a>, not Button's href branch — Button routes through next-intl's
// Link (lib/navigation.ts), built for internal app routes, and every
// existing mailto link in this codebase (Impressum.tsx,
// ProjectDetailContent.tsx) already avoids it for exactly that reason. The
// classes below are Button's own primary/lg styling, copied rather than
// imported since Button doesn't export them standalone.
const MAILTO_BUTTON_CLASSES =
  "group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-md px-10 py-3 text-body-l font-sans font-medium bg-gold text-ink transition-[background-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:scale-[1.02] hover:bg-gold/90 focus-visible:-translate-y-px focus-visible:scale-[1.02] active:translate-y-0 active:scale-[0.99] active:bg-gold/80";

// The one dark section on this page (docs/design-system.md: dark sections
// punctuate) and the page's single clear contact path — every other section
// above (benefits, tiers, statements, membership) builds the case, this is
// where it resolves into one unambiguous action.
export function PartnerContact() {
  const t = useTranslations("PartnerPage.contact");

  return (
    <Section surface="ink" className="relative isolate border-b border-paper/10 py-36">
      <ThreadSegment stop="partner-contact" />
      <Container className="relative flex flex-col items-start gap-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <a href={`mailto:${CONTACT_EMAIL}`} className={MAILTO_BUTTON_CLASSES}>
          {t("cta")}
        </a>
      </Container>
    </Section>
  );
}

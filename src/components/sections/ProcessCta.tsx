import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ThreadSegment } from "@/components/motion/ThreadSegment";

// Single-CTA sibling of ClosingCta.tsx, not a reuse of it: ClosingCta's own
// secondary button links to /prozess, which would point right back at the
// page it's already on here. The brief for this page asks for one CTA
// ("Unten CTA zur Bewerbung"), so this is that, with its own short copy
// rather than the homepage's — see docs/design-system.md's Copy section:
// the same action can keep the same name ("Jetzt bewerben") without the
// surrounding sentence being a copy-paste of another page's.
export function ProcessCta() {
  const t = useTranslations("Process.cta");

  return (
    <Section surface="ink" className="relative isolate border-b border-paper/10 py-36">
      <ThreadSegment stop="process-cta" />
      <Container className="relative flex flex-col items-start gap-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <Button href="/mitmachen" size="lg">
          {t("primaryCta")}
        </Button>
      </Container>
    </Section>
  );
}

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ThreadSegment } from "@/components/motion/ThreadSegment";

// border-b, not border-t: the seam needs to sit where this section ends and
// the (also ink) Footer begins, so the two dark blocks don't visually merge
// into one — a top border would separate it from Benefits/AlumniVoices/
// BoardGrid instead, which is already handled by the surface change itself.
export function ClosingCta() {
  const t = useTranslations("ClosingCta");

  return (
    <Section surface="ink" className="relative isolate border-b border-paper/10 py-36">
      <ThreadSegment stop="cta" />
      <Container className="relative flex flex-col items-start gap-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <div className="flex flex-wrap items-center gap-6">
          <Button href="/mitmachen" size="lg">
            {t("primaryCta")}
          </Button>
          <Button href="/prozess" variant="glass" size="lg">
            {t("secondaryCta")}
          </Button>
        </div>
      </Container>
    </Section>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

// The one dark (ink) section on this page, same "dark moment at the very
// end" convention as ProcessCta/ClosingCta. The primary action scrolls to
// the application section already on this page (id="bewerbung", set on
// MitmachenApplication's Section) rather than linking to /mitmachen again —
// that page is this page, a self-link would be a no-op. Plain
// `scrollIntoView`, not a scroll library: native browser API, explicitly
// user-triggered, not the continuous scroll-hijacking CLAUDE.md rules out.
// `behavior` is picked explicitly rather than left as "smooth": per the
// CSSOM View spec, an explicit "smooth" bypasses the CSS `scroll-behavior`
// property entirely (globals.css's reduced-motion reset only intercepts
// "auto"), so prefers-reduced-motion has to be read here in JS to actually
// honor design-system.md's "disables transforms and parallax entirely"
// rule for this one interaction.
export function MitmachenCta() {
  const t = useTranslations("MitmachenPage.cta");
  const prefersReducedMotion = usePrefersReducedMotion();

  function scrollToApplication() {
    document
      .getElementById("bewerbung")
      ?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <Section surface="ink" className="relative isolate border-b border-paper/10 py-36">
      <ThreadSegment stop="mitmachen-cta" />
      <Container className="relative flex flex-col items-start gap-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <div className="flex flex-wrap items-center gap-6">
          <Button type="button" size="lg" onClick={scrollToApplication}>
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

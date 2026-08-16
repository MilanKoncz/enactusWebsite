import { FileText, Mail, Users, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { GateMarker } from "@/components/ui/GateMarker";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { mitmachenSteps, type MitmachenIconKey } from "@/content/mitmachenProcess";

const ICONS: Record<MitmachenIconKey, LucideIcon> = {
  "file-text": FileText,
  users: Users,
  mail: Mail,
};

// Three stations, not the old page's six — "much shorter" per the brief.
// Static and non-interactive on purpose: ProcessTimeline's hover-expand
// panels exist to hold gating criteria for an 8-station project lifecycle;
// three short, always-visible steps don't need that machinery.
export function MitmachenTimeline() {
  const t = useTranslations("MitmachenPage.timeline");

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col gap-12">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <ol
          aria-label={t("regionLabel")}
          className="grid grid-cols-1 gap-10 sm:grid-cols-3"
        >
          {mitmachenSteps.map((step) => {
            const Icon = ICONS[step.icon];
            return (
              <li key={step.key} className="flex flex-col gap-3">
                <span className="font-mono text-mono-xs uppercase opacity-60">
                  {String(step.order).padStart(2, "0")}
                </span>
                <GateMarker as="h3" label={t(`steps.${step.key}.title`)} />
                <span className="flex items-start gap-2 text-body-s opacity-80">
                  <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span>{t(`steps.${step.key}.short`)}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}

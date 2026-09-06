import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { GateMarker } from "@/components/ui/GateMarker";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Section } from "@/components/ui/Section";
import { steps } from "@/content/innolab";
import type { InnoLabStep } from "@/content/innolab";

type StepCopyKey = Parameters<ReturnType<typeof useTranslations<"InnoLabPage.steps">>>[0];

// Same phase/gate marker split as ProcessTimeline.tsx's Marker function
// (docs/design-system.md's "one motif, carried consistently"): only the
// last step is a real gate — a project either gets the Inno Gating or it
// doesn't — so it alone renders GateMarker's gold rule, while the four
// phase steps get the calmer muted-bar treatment.
function StepMarker({ step, title }: { step: InnoLabStep; title: string }) {
  if (step.kind === "gate") {
    return <GateMarker as="h3" label={title} variant="milestone" />;
  }
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden="true" className="h-8 w-[2px] shrink-0 bg-ink/40" />
      <h3 className="font-mono text-mono-s uppercase">{title}</h3>
    </span>
  );
}

/**
 * The five-step solo path from the board's draft. Same continuous-spine
 * mechanism as IdeathonTimeline.tsx/ProcessTimeline.tsx — an absolute 2px
 * gold rule spanning the whole list, not a second line-drawing technique.
 *
 * The draft's own per-step effort estimate and PDF download were both
 * either unconfirmed or already empty placeholders in its export — neither
 * is invented here; see ASSETS-TODO.md.
 */
export function InnoLabSteps() {
  const t = useTranslations("InnoLabPage.steps");

  return (
    <Section id="schritte">
      <Container className="flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <ol aria-label={t("regionLabel")} className="relative isolate flex flex-col gap-8">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gold"
          />
          {steps.map((step) => (
            <li key={step.key} className="flex flex-col gap-2 pl-9">
              <span className="font-mono text-mono-xs uppercase opacity-60">
                {String(step.order).padStart(2, "0")}
              </span>
              <StepMarker step={step} title={t(`${step.key}.title` as StepCopyKey)} />
              <p className="max-w-2xl text-body-s opacity-80">{t(`${step.key}.description` as StepCopyKey)}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

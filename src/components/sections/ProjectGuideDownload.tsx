import { useTranslations } from "next-intl";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { projectGuide } from "@/content/process";

const HINT_ID = "project-guide-hint";

// content/process.ts's projectGuide.available still gates which of two
// shapes this renders as — a real download link once available, a native
// disabled <button> if a future handover ever leaves it unset again — the
// same defensive fallback every other still-open ASSETS-TODO item in this
// codebase degrades to. The available branch is a plain <a>, not Button's
// href prop: Button routes an href through next-intl's localised Link
// (lib/navigation.ts), which would prefix this static file with /en instead
// of leaving it alone — same reasoning as EventDetails.tsx's
// AddToCalendarLink, which this mirrors down to reusing buttonClasses for
// the exact same look without duplicating those classes by hand. It opens in
// a new tab (target="_blank") rather than forcing a download, so a visitor
// reads the PDF in whatever the browser already renders it with.
export function ProjectGuideDownload() {
  const t = useTranslations("Process.guide");

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col items-start gap-6">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        {projectGuide.available && projectGuide.href ? (
          <div className="flex flex-col items-start gap-2">
            <a href={projectGuide.href} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary")}>
              {t("cta")}
            </a>
            {projectGuide.fileSizeLabel && (
              <p className="font-mono text-mono-xs uppercase opacity-60">
                {t("fileInfo", { size: projectGuide.fileSizeLabel })}
              </p>
            )}
          </div>
        ) : (
          <>
            <Button type="button" disabled aria-describedby={HINT_ID}>
              {t("cta")}
            </Button>
            <p id={HINT_ID} className="border-l-2 border-dashed border-gold py-1 pl-3 text-body-s opacity-60">
              {t("unavailableHint")}
            </p>
          </>
        )}
      </Container>
    </Section>
  );
}

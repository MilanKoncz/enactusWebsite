import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { projectGuide } from "@/content/process";

const HINT_ID = "project-guide-hint";

// The PDF doesn't exist yet (see ASSETS-TODO.md), so content/process.ts's
// projectGuide.available gates which of Button's two supported shapes this
// renders as — a real download link once available, a native disabled
// <button> until then. Button's href branch only has a faux-disabled state
// for `loading`, not an arbitrary `disabled` prop (an <a> has no native
// disabled attribute), so "disabled" here means picking the button-element
// branch, not passing a prop Button doesn't expose for links. A disabled
// button drops out of the tab order entirely, so the reason it's disabled
// can't live only on the control itself: aria-describedby ties it to a hint
// that's also always visible on the page, not a title tooltip a keyboard or
// screen-reader user browsing by virtual cursor would still reach even
// without tabbing to a disabled control, but a mouse-only tooltip never
// would.
export function ProjectGuideDownload() {
  const t = useTranslations("Process.guide");

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col items-start gap-6">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        {projectGuide.available && projectGuide.href ? (
          <Button href={projectGuide.href}>{t("cta")}</Button>
        ) : (
          <Button type="button" disabled aria-describedby={HINT_ID}>
            {t("cta")}
          </Button>
        )}
        {!projectGuide.available && (
          <p id={HINT_ID} className="border-l-2 border-dashed border-gold py-1 pl-3 text-body-s opacity-60">
            {t("unavailableHint")}
          </p>
        )}
      </Container>
    </Section>
  );
}

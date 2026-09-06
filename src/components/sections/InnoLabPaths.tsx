import { useTranslations } from "next-intl";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Section } from "@/components/ui/Section";
import { routes } from "@/content/navigation";
import { paths } from "@/content/innolab";

type PathCopyKey = Parameters<ReturnType<typeof useTranslations<"InnoLabPage.paths">>>[0];

/**
 * "Zwei Wege ins InnoLab" — the board draft's two entry-path cards. Both
 * render as the site's one Card primitive (border-defined, never an opaque
 * fill — Card.tsx's own comment), so the "recommended" reading the draft
 * gave its second card via a solid ink background instead comes from CTA
 * weight: the own-idea path's button is primary (gold), the Ideathon
 * path's is secondary — the two paths are equally valid entry points, not
 * a push toward one over the other, so nothing here should read as
 * pressuring a visitor away from the Ideathon.
 */
export function InnoLabPaths() {
  const t = useTranslations("InnoLabPage.paths");

  return (
    <Section id="wege">
      <Container className="flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <ul className="grid grid-cols-1 gap-7 sm:grid-cols-2">
          {paths.map((path) => (
            <li key={path.key}>
              <Card className="flex h-full flex-col gap-4">
                <span className="self-start rounded-full bg-gold/10 px-3 py-1 font-mono text-mono-xs uppercase text-ink/70">
                  {t(`${path.key}.badge` as PathCopyKey)}
                </span>
                <h3 className="text-heading-3 font-medium">{t(`${path.key}.title` as PathCopyKey)}</h3>
                <p className="text-body-s opacity-80">{t(`${path.key}.description` as PathCopyKey)}</p>
                <ul className="flex flex-col gap-2 text-body-s">
                  {([1, 2, 3] as const).map((n) => (
                    <li key={n} className="flex items-start gap-2">
                      <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-gold" />
                      <span>{t(`${path.key}.bullet${n}` as PathCopyKey)}</span>
                    </li>
                  ))}
                </ul>
                {path.key === "ideathon" ? (
                  <Button href={routes.ideathon} variant="secondary" className="mt-auto self-start">
                    {t(`${path.key}.cta` as PathCopyKey)}
                  </Button>
                ) : (
                  // In-page anchor, not a route — plain <a>, same reasoning
                  // as IdeathonHero's own "#anmelden"/"#ablauf" CTAs: routing
                  // a fragment through the localized Link would prefix it
                  // with /en for nothing.
                  <a href={path.href} className={buttonClasses("primary", "md", "mt-auto self-start")}>
                    {t(`${path.key}.cta` as PathCopyKey)}
                  </a>
                )}
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

import { useLocale, useTranslations } from "next-intl";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { routes } from "@/content/navigation";

/**
 * The page's one h1, ink surface with `.corner-glow` — the same named,
 * board-requested exception /ideathon's hero already uses
 * (docs/design-system.md), not a third background token. Ported from the
 * board's own draft (innolab.html, decoded from its Claude Design canvas
 * export, the same tooling idea.html used for /ideathon).
 *
 * The draft's own signup CTA pointed nowhere ("Zum Anmeldeformular", href="#")
 * — there is no dedicated InnoLab signup form, only the membership
 * application, so both this hero's primary CTA and InnoLabClosingCta's
 * resolve to /mitmachen directly rather than an anchor.
 */
export function InnoLabHero() {
  const t = useTranslations("InnoLabPage.hero");
  const locale = useLocale();

  return (
    <Section surface="ink" className="relative isolate overflow-hidden corner-glow">
      <Container className="relative flex flex-col items-center gap-10 pb-10 text-center md:pb-16">
        <div className="flex flex-col items-center gap-6">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="max-w-3xl text-display-2 font-display break-words">
            {t.rich("title", { em: (chunks) => <span className="text-gold">{chunks}</span> })}
          </h1>
          <p className="max-w-2xl text-body-l opacity-80">{t("lead")}</p>
          {locale === "en" && <p className="max-w-2xl text-body-s opacity-70">{t("languageNote")}</p>}
        </div>

        <div className="flex flex-col items-center gap-1 border-t border-paper/10 pt-6">
          <span className="font-display text-display-4 font-normal! text-gold">{t("cadenceValue")}</span>
          <Eyebrow>{t("cadenceLabel")}</Eyebrow>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button href={routes.mitmachen} size="lg">
            {t("registerCta")}
          </Button>
          <a href="#schritte" className={buttonClasses("glass", "lg")}>
            {t("howCta")}
          </a>
        </div>
      </Container>
    </Section>
  );
}

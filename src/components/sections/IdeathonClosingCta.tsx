import { useTranslations } from "next-intl";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";

export function IdeathonClosingCta() {
  const t = useTranslations("IdeathonPage.closing");

  return (
    <Section surface="ink" className="text-center">
      <Container className="flex flex-col items-center gap-4">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h2 className="max-w-2xl text-display-3 font-display break-words">
          {t.rich("title", { em: (chunks) => <span className="text-gold">{chunks}</span> })}
        </h2>
        <p className="max-w-xl text-body-l opacity-80">{t("lead")}</p>
        <a href="#anmelden" className={buttonClasses("primary", "lg")}>
          {t("registerCta")}
        </a>
        <p className="text-body-s opacity-60">{t("footnote")}</p>
      </Container>
    </Section>
  );
}

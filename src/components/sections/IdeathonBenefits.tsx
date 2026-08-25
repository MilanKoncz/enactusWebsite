import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { benefits } from "@/content/ideathon";

type BenefitCopyKey = Parameters<ReturnType<typeof useTranslations<"IdeathonPage.benefits">>>[0];

export function IdeathonBenefits() {
  const t = useTranslations("IdeathonPage.benefits");

  return (
    <Section>
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="text-display-3 font-display break-words">{t("title")}</h2>
        </div>
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <li key={benefit.key}>
              <Card className="flex h-full flex-col gap-3">
                {benefit.figure ? (
                  <p className="text-display-4 font-display">{benefit.figure}</p>
                ) : (
                  <span className="font-mono text-mono-s opacity-60">{String(benefit.order).padStart(2, "0")}</span>
                )}
                <h3 className="text-heading-3 font-medium">{t(`${benefit.key}.title` as BenefitCopyKey)}</h3>
                <p className="text-body-s opacity-80">{t(`${benefit.key}.description` as BenefitCopyKey)}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

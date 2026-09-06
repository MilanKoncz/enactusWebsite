import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Section } from "@/components/ui/Section";
import { insideItems } from "@/content/innolab";

type InsideCopyKey = Parameters<ReturnType<typeof useTranslations<"InnoLabPage.inside">>>[0];

export function InnoLabInside() {
  const t = useTranslations("InnoLabPage.inside");

  return (
    <Section id="im-innolab" surface="ink">
      <Container className="flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {insideItems.map((item) => (
            <li key={item.key} className="flex flex-col gap-2 border-t-2 border-gold pt-5">
              <h3 className="text-heading-3 font-medium">{t(`${item.key}.title` as InsideCopyKey)}</h3>
              <p className="text-body-s opacity-80">{t(`${item.key}.description` as InsideCopyKey)}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

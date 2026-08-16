import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

// No signup button here on purpose: the old site's "Fördermitglied werden"
// CTA pointed at infrastructure this rebuild doesn't have yet, and inventing
// a working-looking one would be worse than not having it — see `note`
// below, which routes interest to PartnerContact instead, the one real
// contact path this page has.
export function PartnerMembership() {
  const t = useTranslations("PartnerPage.membership");

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="font-mono text-mono-xs uppercase opacity-60">{t("supportsHeading")}</p>
            <ul className="flex flex-col gap-2">
              {(t.raw("supports") as string[]).map((item: string) => (
                <li key={item} className="flex items-start gap-2 text-body-s opacity-80">
                  <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-mono text-mono-xs uppercase opacity-60">{t("benefitsHeading")}</p>
            <ul className="flex flex-col gap-2">
              {(t.raw("benefitsList") as string[]).map((item: string) => (
                <li key={item} className="flex items-start gap-2 text-body-s opacity-80">
                  <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-body-s opacity-60">{t("note")}</p>
      </Container>
    </Section>
  );
}

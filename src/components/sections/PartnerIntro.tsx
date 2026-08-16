import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { GateMarker } from "@/components/ui/GateMarker";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

const BENEFIT_KEYS = ["recruiting", "image", "publicity", "philanthropy"] as const;

// /partner has no hero, so this SectionHeading carries the page's one h1 —
// same reasoning as the other route intros. The four benefits reuse
// Pillars.tsx's GateMarker-as-heading pattern (one fewer heading level
// repeating the same two or three words right below it), pulled from the
// old site's own copy (enactus-mannheim.com/partner) rather than rewritten
// — this is the sales case for sponsorship, not a place to improvise claims.
export function PartnerIntro() {
  const t = useTranslations("PartnerPage");
  const tBenefits = useTranslations("PartnerPage.benefits");

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col gap-16">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} lead={t("intro")} />
        <div className="flex flex-col gap-8">
          <SectionHeading eyebrow={t("eyebrow")} title={tBenefits("heading")} lead={tBenefits("lead")} />
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFIT_KEYS.map((key) => (
              <div key={key} className="flex flex-col gap-3">
                <GateMarker label={tBenefits(`${key}.title`)} />
                <p className="text-body-s opacity-80">{tBenefits(`${key}.text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

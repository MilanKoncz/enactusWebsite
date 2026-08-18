import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";

export type ComingSoonProps = {
  title: string;
  description?: string;
};

// Shared body for every placeholder route page, so navigation never
// dead-ends while the real content is built. Exactly one h1, no gate
// marker — a stub page isn't a milestone.
export function ComingSoon({ title, description }: ComingSoonProps) {
  const t = useTranslations("ComingSoon");

  return (
    <Section>
      <Container className="flex flex-col gap-4 text-center">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="text-display-3 font-display">{title}</h1>
        <p className="text-body-l opacity-60">{description ?? t("note")}</p>
      </Container>
    </Section>
  );
}

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Faq } from "./Faq";
import { ContactForm } from "./ContactForm";

// One section, two columns — not two stacked sections like every other
// route in this rebuild, since the brief's layout ("FAQ links,
// Kontaktformular rechts. Auf Mobile FAQ zuerst") only makes sense as a
// single side-by-side pairing. FAQ is simply the first grid child: that
// alone puts it on the left at lg+ (the natural reading order in a
// left-to-right grid row) and first when the grid collapses to one column
// below lg — no separate mobile-only reordering needed.
export function KontaktContent() {
  const t = useTranslations("KontaktPage");

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col gap-16">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <h2 className="text-heading-2 font-display font-normal!">{t("faq.heading")}</h2>
            <Faq />
          </div>
          <div className="flex flex-col gap-6">
            <h2 className="text-heading-2 font-display font-normal!">{t("form.heading")}</h2>
            <ContactForm />
          </div>
        </div>
      </Container>
    </Section>
  );
}

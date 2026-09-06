import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Link } from "@/lib/navigation";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Section } from "@/components/ui/Section";
import { routes } from "@/content/navigation";

export function InnoLabAfter() {
  const t = useTranslations("InnoLabPage.after");

  return (
    <Section>
      <Container className="flex flex-col gap-8">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <div className="max-w-2xl rounded-md bg-gold/10 px-6 py-6 text-center text-body-s md:px-8">
          {t.rich("processNote", {
            processLink: (chunks) => (
              <Link href={routes.prozess} className="link-underline font-medium">
                {chunks}
              </Link>
            ),
          })}
        </div>
      </Container>
    </Section>
  );
}

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { routes } from "@/content/navigation";

/**
 * Points /events at the new /ideathon page. Not a fifth tile in
 * EventFormats.tsx — that grid is a fixed, board-confirmed set of four
 * formats (see that file's own comment) — this is its own small callout,
 * between the page intro and the format grid.
 */
export function EventsIdeathonCallout() {
  const t = useTranslations("EventsIdeathonCallout");

  return (
    <Section className="py-10 md:py-10">
      <Container className="flex flex-wrap items-center justify-between gap-6 rounded-md border border-gold/40 bg-gold/10 px-6 py-6 sm:px-10 sm:py-8">
        <div className="flex flex-col gap-1">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <p className="text-heading-3 font-medium">{t("title")}</p>
          <p className="text-body-s opacity-80">{t("lead")}</p>
        </div>
        <Button href={routes.ideathon} size="md">
          {t("cta")}
        </Button>
      </Container>
    </Section>
  );
}

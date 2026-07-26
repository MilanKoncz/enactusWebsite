import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { routes } from "@/content/navigation";

// Next.js's not-found.tsx convention doesn't receive route params, so this
// relies on the request-scoped locale the [locale] layout already set via
// setRequestLocale rather than an explicit locale override.
export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <Section>
      <Container className="flex flex-col gap-4 py-12 text-center">
        <h1 className="text-display-3 font-display">{t("title")}</h1>
        <p className="text-body-l opacity-60">{t("note")}</p>
        <Button href={routes.home}>{t("backHome")}</Button>
      </Container>
    </Section>
  );
}

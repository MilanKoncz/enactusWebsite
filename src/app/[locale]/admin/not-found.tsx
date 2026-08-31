import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

// Board-only tool, so this stays plain and functional — none of the
// (site) 404's easter-egg construction site (src/app/[locale]/(site)/not-found.tsx),
// which is built for a visitor landing on a broken public link, not for
// board members navigating their own admin bookmarks.
export default async function AdminNotFound() {
  const t = await getTranslations("AdminNotFound");

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-16 text-center">
      <h1 className="text-heading-3 font-sans">{t("title")}</h1>
      <p className="max-w-md text-body-m opacity-70">{t("note")}</p>
      <Button href="/admin">{t("backToOverview")}</Button>
    </Container>
  );
}

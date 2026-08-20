import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { SecretEntryConfetti } from "@/components/motion/SecretEntryConfetti";
import { routes } from "@/content/navigation";
import { Link } from "@/lib/navigation";

type PageProps = { params: Promise<{ locale: string }> };

// Easter egg 7/7 (docs/eastereggs.md) — a hidden, unlinked page, not one of
// content/navigation.ts's `routes`, so it never appears in Header, Footer,
// or sitemap.ts (which builds its path list from exactly that record).
// Reachable only by typing the URL. noindex/nofollow here on top of
// robots.ts's explicit disallow, same belt-and-braces pattern
// admin/bewerbungen's page uses for its own noindex metadata.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Secret" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

// Gold as a text color is only ever legible on ink (docs/design-system.md)
// — this page runs on an ink surface for that reason, same as not-found.tsx.
export default async function SecretPage({ params }: PageProps) {
  await requireLocale(params);
  const t = await getTranslations("Secret");

  return (
    <Section surface="ink" className="relative">
      <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <h1 className="text-display-3 font-display text-gold">{t("title")}</h1>
        <p className="max-w-md text-body-l opacity-80">{t("body")}</p>
        <Link href={routes.home} className="link-underline text-body-m">
          {t("backHome")}
        </Link>
      </Container>
      <SecretEntryConfetti />
    </Section>
  );
}

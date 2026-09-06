import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { pageAlternates } from "@/lib/seo";
import { InnoLabHero } from "@/components/sections/InnoLabHero";
import { InnoLabPaths } from "@/components/sections/InnoLabPaths";
import { InnoLabSteps } from "@/components/sections/InnoLabSteps";
import { InnoLabInside } from "@/components/sections/InnoLabInside";
import { InnoLabBoundary } from "@/components/sections/InnoLabBoundary";
import { InnoLabAfter } from "@/components/sections/InnoLabAfter";
import { InnoLabFaq } from "@/components/sections/InnoLabFaq";
import { InnoLabClosingCta } from "@/components/sections/InnoLabClosingCta";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Routes" });
  const tSeo = await getTranslations({ locale, namespace: "Seo" });
  return {
    title: t("innolab"),
    description: tSeo("innolab"),
    alternates: pageAlternates("/innolab", locale),
  };
}

export default async function InnoLabPage({ params }: PageProps) {
  await requireLocale(params);

  return (
    <>
      <InnoLabHero />
      <InnoLabPaths />
      <InnoLabSteps />
      <InnoLabInside />
      <InnoLabBoundary />
      <InnoLabAfter />
      <InnoLabFaq />
      <InnoLabClosingCta />
    </>
  );
}

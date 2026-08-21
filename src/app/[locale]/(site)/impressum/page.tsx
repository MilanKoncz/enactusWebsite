import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { pageAlternates } from "@/lib/seo";
import { Impressum } from "@/components/sections/Impressum";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Routes" });
  const tSeo = await getTranslations({ locale, namespace: "Seo" });
  return {
    title: t("impressum"),
    description: tSeo("impressum"),
    alternates: pageAlternates("/impressum", locale),
  };
}

export default async function ImpressumPage({ params }: PageProps) {
  await requireLocale(params);
  return <Impressum />;
}

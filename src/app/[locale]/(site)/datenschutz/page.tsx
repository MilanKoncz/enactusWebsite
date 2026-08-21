import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { pageAlternates } from "@/lib/seo";
import { Datenschutz } from "@/components/sections/Datenschutz";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Routes" });
  const tSeo = await getTranslations({ locale, namespace: "Seo" });
  return {
    title: t("datenschutz"),
    description: tSeo("datenschutz"),
    alternates: pageAlternates("/datenschutz", locale),
  };
}

export default async function DatenschutzPage({ params }: PageProps) {
  await requireLocale(params);
  return <Datenschutz />;
}

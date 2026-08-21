import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { pageAlternates } from "@/lib/seo";
import { KontaktContent } from "@/components/sections/KontaktContent";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Routes" });
  const tSeo = await getTranslations({ locale, namespace: "Seo" });
  return {
    title: t("kontakt"),
    description: tSeo("kontakt"),
    alternates: pageAlternates("/kontakt", locale),
  };
}

export default async function KontaktPage({ params }: PageProps) {
  await requireLocale(params);

  return <KontaktContent />;
}

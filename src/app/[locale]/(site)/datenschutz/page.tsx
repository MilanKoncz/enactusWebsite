import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Datenschutz } from "@/components/sections/Datenschutz";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Routes" });
  return { title: t("datenschutz") };
}

export default async function DatenschutzPage({ params }: PageProps) {
  await requireLocale(params);
  return <Datenschutz />;
}

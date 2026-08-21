import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { pageAlternates } from "@/lib/seo";
import { PartnerIntro } from "@/components/sections/PartnerIntro";
import { PartnerTiers } from "@/components/sections/PartnerTiers";
import { PartnerStatementsSection } from "@/components/sections/PartnerStatementsSection";
import { PartnerMembership } from "@/components/sections/PartnerMembership";
import { PartnerContact } from "@/components/sections/PartnerContact";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Routes" });
  const tSeo = await getTranslations({ locale, namespace: "Seo" });
  return {
    title: t("partner"),
    description: tSeo("partner"),
    alternates: pageAlternates("/partner", locale),
  };
}

export default async function PartnerPage({ params }: PageProps) {
  await requireLocale(params);

  return (
    <>
      <PartnerIntro />
      <PartnerTiers />
      <PartnerStatementsSection />
      <PartnerMembership />
      <PartnerContact />
    </>
  );
}

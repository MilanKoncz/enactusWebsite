import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
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
  return { title: t("partner") };
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

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { HomeHero } from "@/components/sections/HomeHero";
import { PartnerMarquee } from "@/components/sections/PartnerMarquee";
import { HomeKpis } from "@/components/sections/HomeKpis";
import { Pillars } from "@/components/sections/Pillars";
import { Benefits } from "@/components/sections/Benefits";
import { AlumniVoices } from "@/components/sections/AlumniVoices";
import { BoardGrid } from "@/components/sections/BoardGrid";
import { ClosingCta } from "@/components/sections/ClosingCta";
import { GateDivider } from "@/components/sections/GateDivider";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Site" });
  return { title: t("name") };
}

// Rhythm: ink -> [paper paper] -> ink -> [paper paper paper] -> ink. Three
// dark moments (hero, pillars, closing CTA), never a section-by-section
// alternation — docs/design-system.md: dark sections are punctuation, not
// half the page. The gate-marker divider only ever appears inside a light
// run, where no surface change already marks the seam (see
// components/sections/GateDivider.tsx).
export default async function HomePage({ params }: PageProps) {
  const locale = await requireLocale(params);
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <>
      <HomeHero />
      <PartnerMarquee />
      <GateDivider label={t("dividers.kpis")} />
      <HomeKpis />
      <Pillars />
      <Benefits />
      <GateDivider label={t("dividers.alumni")} />
      <AlumniVoices />
      <GateDivider label={t("dividers.board")} />
      <BoardGrid />
      <ClosingCta />
    </>
  );
}

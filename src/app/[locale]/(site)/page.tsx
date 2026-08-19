import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { HomeHero } from "@/components/sections/HomeHero";
import { PartnerMarquee } from "@/components/sections/PartnerMarquee";
import { HomeKpis } from "@/components/sections/HomeKpis";
import { Pillars } from "@/components/sections/Pillars";
import { Benefits } from "@/components/sections/Benefits";
import { AlumniEmployers } from "@/components/sections/AlumniEmployers";
import { AlumniVoices } from "@/components/sections/AlumniVoices";
import { BoardGrid } from "@/components/sections/BoardGrid";
import { ClosingCta } from "@/components/sections/ClosingCta";
import { GateDivider } from "@/components/sections/GateDivider";
import { ALUMNI_STATEMENTS_ENABLED } from "@/content/alumni";

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
//
// The golden thread (components/motion/ThreadSegment.tsx) runs underneath
// this same rhythm, from PartnerMarquee to ClosingCta — the hero stays the
// one orchestrated moment with no competing motion, and the thread picks up
// right where it ends. Its stops (threadRoute.ts) are named for and ordered
// exactly like the sections below; the three GateDivider stops keep the
// thread vertical and centered, so it becomes each gate's rule for a moment
// instead of running beside it. This page is the only one that carries it.
export default async function HomePage({ params }: PageProps) {
  const locale = await requireLocale(params);
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <>
      <HomeHero />
      <PartnerMarquee />
      {/* No label here: the figures below name themselves, and a
          "Kennzahlen" caption on the thread was doing nothing the section
          didn't already say. The gate keeps its seam in the run. */}
      <GateDivider stop="gate-kpis" />
      <HomeKpis />
      <Pillars />
      <Benefits />
      <GateDivider label={t("dividers.alumni")} stop="gate-alumni" />
      <AlumniEmployers />
      {/* Not rendered until content/alumni.ts's ALUMNI_STATEMENTS_ENABLED
          flips true — the placeholder quotes it would otherwise show must
          never go live (ASSETS-TODO.md). threadRoute.ts's alumni-employers
          and alumni-voices stops both start and end at the shared midpoint
          (50), so the golden thread's seam holds whether this renders or
          not. */}
      {ALUMNI_STATEMENTS_ENABLED && <AlumniVoices />}
      <GateDivider label={t("dividers.board")} stop="gate-board" />
      <BoardGrid />
      <ClosingCta />
    </>
  );
}

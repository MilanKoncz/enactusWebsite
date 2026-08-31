import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { pageAlternates } from "@/lib/seo";
import { MitmachenFit } from "@/components/sections/MitmachenFit";
import { MitmachenTimeline } from "@/components/sections/MitmachenTimeline";
import { MitmachenApplication } from "@/components/sections/MitmachenApplication";
import { MitmachenCta } from "@/components/sections/MitmachenCta";
import { getRecruitingWindows } from "@/lib/recruitingWindows";
import { getProjectAreas } from "@/lib/projectAreas";
import { getDepartments } from "@/lib/departments";

type PageProps = {
  params: Promise<{ locale: string }>;
};

// Title comes from the shared Routes namespace, same as every other route —
// see _lib/createComingSoonPage.tsx, which this page replaces now that the
// content exists.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Routes" });
  const tSeo = await getTranslations({ locale, namespace: "Seo" });
  return {
    title: t("mitmachen"),
    description: tSeo("mitmachen"),
    alternates: pageAlternates("/mitmachen", locale),
  };
}

// No separate hero/intro section — the brief skips one, so MitmachenFit's
// SectionHeading carries the page's one h1. No FAQ, no alumni statements
// here either: those live on /kontakt and the homepage respectively.
export default async function MitmachenPage({ params }: PageProps) {
  await requireLocale(params);
  const [recruitingWindows, projectAreas, departments] = await Promise.all([
    getRecruitingWindows(),
    getProjectAreas(),
    getDepartments(),
  ]);

  return (
    <>
      <MitmachenFit />
      <MitmachenTimeline />
      <MitmachenApplication recruitingWindows={recruitingWindows} projectAreas={projectAreas} departments={departments} />
      <MitmachenCta />
    </>
  );
}

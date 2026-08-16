import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { ProcessIntro } from "@/components/sections/ProcessIntro";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { ProjectGuideDownload } from "@/components/sections/ProjectGuideDownload";
import { ProcessCta } from "@/components/sections/ProcessCta";

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
  return { title: t("prozess") };
}

// Rhythm: paper -> paper -> paper -> ink, one dark moment at the very end
// (the CTA), matching the homepage's "dark sections are punctuation" rule —
// this page never had a hero to spend that budget on, so ProcessTimeline
// (the compressed, expandable stage-gate sequence) is where the visual
// weight actually goes instead.
//
// No golden thread here: it is a homepage-only signature since 2026-08-16
// (see threadRoute.ts) — carrying it down every page turned the one
// memorable element into wallpaper.
export default async function ProcessPage({ params }: PageProps) {
  await requireLocale(params);

  return (
    <>
      <ProcessIntro />
      <ProcessTimeline />
      <ProjectGuideDownload />
      <ProcessCta />
    </>
  );
}

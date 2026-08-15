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
// The golden thread runs through all four sections as the "process-*"
// threadRoute.ts stops, picking up fresh at process-intro rather than
// continuing from the homepage's own last stop — this page is reachable
// directly, not only by scrolling on from "/". ProcessTimeline is the one
// stop that changes axis: horizontal at md+, where the timeline itself is
// laid out sideways, vertical below it, where the timeline stacks — see
// threadRoute.ts's axisFor and ProcessTimeline.tsx's own comment.
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

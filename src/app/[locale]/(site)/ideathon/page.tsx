import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { pageAlternates } from "@/lib/seo";
import { getCalendarEvents, getServerNowMs } from "@/lib/calendarEvents";
import { IdeathonEventGate } from "@/components/sections/IdeathonEventGate";
import { PartnerMarquee } from "@/components/sections/PartnerMarquee";
import { IdeathonFaq } from "@/components/sections/IdeathonFaq";
import { IdeathonClosingCta } from "@/components/sections/IdeathonClosingCta";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Routes" });
  const tSeo = await getTranslations({ locale, namespace: "Seo" });
  return {
    title: t("ideathon"),
    description: tSeo("ideathon"),
    alternates: pageAlternates("/ideathon", locale),
  };
}

export default async function IdeathonPage({ params }: PageProps) {
  await requireLocale(params);

  // Build/ISR-time only — IdeathonEventGate re-fetches the same data itself
  // on mount (GET /api/calendar-events) and prefers that result, the seam
  // that keeps this page's "which Ideathon is next" state testable and
  // fresh instead of frozen into the static build (see that component's
  // own comment).
  const events = await getCalendarEvents();
  const nowMs = getServerNowMs();

  return (
    <>
      <IdeathonEventGate events={events} initialNowMs={nowMs} />
      <PartnerMarquee showThread={false} />
      <IdeathonFaq />
      <IdeathonClosingCta />
    </>
  );
}

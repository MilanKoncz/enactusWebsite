import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { pageAlternates } from "@/lib/seo";
import { EventsIntro } from "@/components/sections/EventsIntro";
import { EventFormats } from "@/components/sections/EventFormats";
import { JourneysSection } from "@/components/sections/JourneysSection";
import { EventsNetwork } from "@/components/sections/EventsNetwork";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Routes" });
  const tSeo = await getTranslations({ locale, namespace: "Seo" });
  return {
    title: t("events"),
    description: tSeo("events"),
    alternates: pageAlternates("/events", locale),
  };
}

export default async function EventsPage({ params }: PageProps) {
  await requireLocale(params);

  return (
    <>
      <EventsIntro />
      <EventFormats />
      <JourneysSection />
      <EventsNetwork />
    </>
  );
}

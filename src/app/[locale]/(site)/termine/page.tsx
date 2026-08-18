import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { EventCalendar } from "@/components/sections/EventCalendar";
import { getCalendarEvents, getServerNowMs } from "@/lib/calendarEvents";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Routes" });
  return { title: t("termine") };
}

// Moved off the homepage (2026-08-18): the calendar had grown into the
// biggest single section there. EventCalendar already carries its own
// heading, lead and empty states (SectionHeading as="h1" once it's the
// page's top section, same reasoning as EventsIntro.tsx), so this page is
// just that component with its server-fetched data, unchanged from how the
// homepage rendered it.
export default async function TerminePage({ params }: PageProps) {
  await requireLocale(params);
  const events = await getCalendarEvents();
  // The server's own render-time clock, passed down so EventCalendar's
  // first client render can agree with the server exactly — see that
  // component's own comment on why this isn't read from useNow() instead.
  const nowMs = getServerNowMs();

  return <EventCalendar events={events} initialNowMs={nowMs} />;
}

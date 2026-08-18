import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { CalendarEventsManager } from "@/components/admin/CalendarEventsManager";
import { isAdminAuthenticated } from "@/lib/adminSession";
import { listCalendarEvents } from "@/lib/db";
import { isPastEvent } from "@/lib/calendarAgenda";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Admin.calendarEvents" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AdminCalendarEventsPage({ params }: PageProps) {
  await requireLocale(params);
  if (!(await isAdminAuthenticated())) return <AdminLogin />;

  const t = await getTranslations("Admin");
  const events = await listCalendarEvents();

  // Upcoming first (soonest first), past below (most recent first) — the
  // board mostly cares about what's still ahead; a past entry is only
  // there to edit a typo or delete a duplicate.
  const now = new Date().getTime();
  const upcoming = events.filter((event) => !isPastEvent(event, now));
  const past = events.filter((event) => isPastEvent(event, now)).reverse();

  return (
    <Container className="flex max-w-4xl flex-col gap-8 py-16">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        title={t("calendarEvents.title")}
        lead={t("calendarEvents.lead")}
      />
      <CalendarEventsManager events={[...upcoming, ...past]} />
    </Container>
  );
}

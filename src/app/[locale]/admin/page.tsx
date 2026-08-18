import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { RawLink } from "@/lib/navigation";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminStatusBar } from "@/components/admin/AdminStatusBar";
import { ADMIN_SECTIONS } from "@/components/admin/adminSections";
import { isAdminAuthenticated } from "@/lib/adminSession";
import {
  countFutureRecruitingWindows,
  listApplications,
  listCalendarEvents,
  listCronRuns,
  listFailedMails,
  listRecruitingWindows,
} from "@/lib/db";
import { currentOrNextRecruitingWindow, recruitingPhaseAt } from "@/lib/recruitingStatus";
import { isCleanupStale } from "@/lib/cronSchedule";
import { nextUpcomingEvent } from "@/lib/calendarAgenda";

type PageProps = { params: Promise<{ locale: string }> };

// Board-internal tooling, never crawlable: noindex here, and excluded from
// robots.ts's allow list and from sitemap.ts entirely.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Admin.overview" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

// /admin had no page at all before this — a bare visit fell through to
// (site)/[...rest] and rendered the public, chrome-wrapped 404, which is a
// confusing thing to hand a board member who typed the URL they were told.
export default async function AdminOverviewPage({ params }: PageProps) {
  await requireLocale(params);
  if (!(await isAdminAuthenticated())) return <AdminLogin />;

  const t = await getTranslations("Admin");

  // Each dependency settled independently — the status bar is exactly the
  // page where "one query failed" must not blank the whole thing, since
  // that's precisely when someone is looking at it (same reasoning as
  // /admin/system).
  const [applications, failedMails, cronRuns, calendarEvents, recruitingWindows, futureWindowCount] =
    await Promise.all([
      listApplications().catch(() => []),
      listFailedMails().catch(() => []),
      listCronRuns(10).catch(() => []),
      listCalendarEvents().catch(() => []),
      listRecruitingWindows().catch(() => []),
      countFutureRecruitingWindows().catch(() => 0),
    ]);

  const now = new Date();
  const nowMs = now.getTime();

  const phase = recruitingPhaseAt(nowMs, recruitingWindows);
  const openWindow = phase === "open" ? currentOrNextRecruitingWindow(nowMs, recruitingWindows) : null;
  const applicationsInWindow = openWindow
    ? {
        count: applications.filter((application) => application.recruitingSemester === openWindow.semester)
          .length,
        semester: openWindow.semester,
      }
    : null;

  const lastSuccessfulRun = cronRuns.find((run) => run.ok) ?? null;
  const cronStale = isCleanupStale(lastSuccessfulRun?.startedAt ?? null, now);

  const nextEvent = nextUpcomingEvent(calendarEvents, nowMs);
  const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });
  const eventDateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

  return (
    <Container className="flex max-w-4xl flex-col gap-10 py-16">
      <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("overview.title")} lead={t("overview.lead")} />

      <AdminStatusBar
        applicationsInWindow={applicationsInWindow}
        failedMailsCount={failedMails.length}
        hasFutureRecruitingWindow={futureWindowCount > 0}
        cronStale={cronStale}
        cronLastRunAt={lastSuccessfulRun?.startedAt ?? null}
        nextEvent={
          nextEvent ? { title: nextEvent.title, date: eventDateFormatter.format(new Date(`${nextEvent.startDate}T00:00:00`)) } : null
        }
        dateFormatter={dateTimeFormatter}
        labels={{
          applicationsHeading: t("overview.statusBar.applicationsHeading"),
          applicationsNoWindow: t("overview.statusBar.applicationsNoWindow"),
          failedMailsHeading: t("overview.statusBar.failedMailsHeading"),
          failedMailsOk: t("overview.statusBar.failedMailsOk"),
          failedMailsWarning: (count) => t("overview.statusBar.failedMailsWarning", { count }),
          futureWindowHeading: t("overview.statusBar.futureWindowHeading"),
          futureWindowOk: t("overview.statusBar.futureWindowOk"),
          futureWindowWarning: t("overview.statusBar.futureWindowWarning"),
          cronHeading: t("overview.statusBar.cronHeading"),
          cronOk: (when) => t("overview.statusBar.cronOk", { when }),
          cronNeverRan: t("overview.statusBar.cronNeverRan"),
          cronStaleLabel: (when) => t("overview.statusBar.cronStaleLabel", { when }),
          nextEventHeading: t("overview.statusBar.nextEventHeading"),
          nextEventEmpty: t("overview.statusBar.nextEventEmpty"),
        }}
      />

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ADMIN_SECTIONS.map((section) => (
          <li key={section.href}>
            <RawLink
              href={section.href}
              className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Card className="flex h-full items-start gap-3">
                <section.icon aria-hidden="true" className="mt-1 size-5 shrink-0 opacity-60" />
                <span>
                  <h2 className="text-body-l font-medium">{t(`nav.${section.messageKey}`)}</h2>
                  <p className="mt-1 text-body-s opacity-60">
                    {t(`overview.sections.${section.messageKey}`)}
                  </p>
                </span>
              </Card>
            </RawLink>
          </li>
        ))}
      </ul>
    </Container>
  );
}

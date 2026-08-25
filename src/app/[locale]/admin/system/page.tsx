import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusIndicator } from "@/components/admin/StatusIndicator";
import { isAdminAuthenticated } from "@/lib/adminSession";
import { countRowsPerTable, listCronRuns } from "@/lib/db";
import type { CronRun, TableCounts } from "@/lib/db";
import { checkResend } from "@/lib/serviceHealth";
import { isCleanupStale, nextCleanupRun } from "@/lib/cronSchedule";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Admin.system" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

const TABLE_KEYS = [
  "applications",
  "contactMessages",
  "reminderSignups",
  "recruitingWindows",
  "calendarEvents",
  "jobPostings",
  "rateLimitHits",
  "cronRuns",
  "ideathonSignups",
] as const;

export default async function AdminSystemPage({ params }: PageProps) {
  await requireLocale(params);
  if (!(await isAdminAuthenticated())) return <AdminLogin />;

  const t = await getTranslations("Admin");

  // Each dependency is settled independently: one being down must not stop
  // the page from reporting on the others, which is precisely when someone
  // is looking at it.
  const [runsResult, countsResult, resend] = await Promise.all([
    // 20, not 10: cron_runs now interleaves two job types (cleanup,
    // reminder-window) on the same daily trigger, so 10 rows would often
    // show only one of them.
    listCronRuns(20).then(
      (runs) => ({ ok: true as const, runs }),
      (error: unknown) => ({ ok: false as const, error }),
    ),
    countRowsPerTable().then(
      (counts) => ({ ok: true as const, counts }),
      (error: unknown) => ({ ok: false as const, error }),
    ),
    checkResend(),
  ]);

  const runs: CronRun[] = runsResult.ok ? runsResult.runs : [];
  const counts: TableCounts | null = countsResult.ok ? countsResult.counts : null;
  // countRowsPerTable answering *is* the database health check — see
  // lib/serviceHealth.ts on why there's no separate ping.
  const databaseReachable = countsResult.ok;

  // The stale-cron warning is specifically about the retention promise
  // cleanup enforces — filtered to that job alone, so a healthy
  // reminder-window run can never mask a broken cleanup run (or vice
  // versa) just because they now share one table.
  const cleanupRuns = runs.filter((run) => run.job === "cleanup");
  const now = new Date();
  const lastRun = cleanupRuns[0] ?? null;
  const lastSuccessful = cleanupRuns.find((run) => run.ok) ?? null;
  const stale = isCleanupStale(lastSuccessful?.startedAt ?? null, now);
  const nextDue = nextCleanupRun(now);

  const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

  return (
    <Container className="flex max-w-4xl flex-col gap-10 py-16">
      <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("system.title")} lead={t("system.lead")} />

      {/* The warning this page exists for. The cron has already missed a
          scheduled slot in production with nothing noticing; over 48 hours
          means it has missed at least two, which is past anything a slow
          trigger explains. */}
      {stale && (
        <p
          role="alert"
          className="flex items-start gap-3 rounded-md border border-oxblood bg-oxblood/10 p-4 text-body-s"
        >
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            {lastSuccessful
              ? t("system.cronStale", { when: dateFormatter.format(lastSuccessful.startedAt) })
              : t("system.cronNeverRan")}
          </span>
        </p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-3 font-display font-normal!">{t("system.cronHeading")}</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <dt className="text-body-s opacity-60">{t("system.lastRun")}</dt>
            <dd className="mt-1 text-body-m">
              {lastRun ? dateFormatter.format(lastRun.startedAt) : t("system.never")}
            </dd>
          </Card>
          <Card>
            <dt className="text-body-s opacity-60">{t("system.nextDue")}</dt>
            <dd className="mt-1 text-body-m">{dateFormatter.format(nextDue)}</dd>
          </Card>
        </dl>

        <AdminTable
          minWidthClassName="min-w-[820px]"
          columns={[
            t("system.columns.startedAt"),
            t("system.columns.job"),
            t("system.columns.result"),
            t("system.columns.deleted"),
            t("system.columns.error"),
          ]}
          empty={t("system.noRuns")}
          rows={runs.map((run) => ({
            key: run.id,
            cells: [
              dateFormatter.format(run.startedAt),
              t(run.job === "cleanup" ? "system.jobs.cleanup" : "system.jobs.reminderWindow"),
              <StatusIndicator
                key="ok"
                level={run.ok ? "ok" : "error"}
                label={run.ok ? t("system.ok") : t("system.failed")}
              />,
              <span key="counts" className="font-mono text-mono-s">
                {run.job === "cleanup"
                  ? t("system.deletedCounts", {
                      applications: run.deletedApplications,
                      contactMessages: run.deletedContactMessages,
                      reminderSignups: run.deletedReminderSignups,
                      rateLimitHits: run.prunedRateLimitHits,
                    })
                  : t("system.reminderWindowCounts", {
                      sent: run.sentReminderWindowMails,
                      failed: run.failedReminderWindowMails,
                    })}
              </span>,
              <span key="error" className="font-mono text-mono-s opacity-80">
                {run.error ?? "—"}
              </span>,
            ],
          }))}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-3 font-display font-normal!">{t("system.servicesHeading")}</h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <li>
            <Card className="flex flex-col gap-1">
              <span className="text-body-m">{t("system.database")}</span>
              <StatusIndicator
                level={databaseReachable ? "ok" : "error"}
                label={databaseReachable ? t("system.reachable") : t("system.unreachable")}
              />
            </Card>
          </li>
          <li>
            <Card className="flex flex-col gap-1">
              <span className="text-body-m">{t("system.resend")}</span>
              <StatusIndicator
                level={resend.level}
                label={t(`system.resendStatus.${resend.reason}`, {
                  when: resend.lastAttemptAt ? dateFormatter.format(resend.lastAttemptAt) : "",
                  failed: resend.failedLast30Days,
                })}
              />
            </Card>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-3 font-display font-normal!">{t("system.rowsHeading")}</h2>
        {counts ? (
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {TABLE_KEYS.map((key) => (
              <Card key={key}>
                <dt className="text-body-s opacity-60">{t(`system.tables.${key}`)}</dt>
                <dd className="mt-1 font-mono text-display-3 tabular-nums">{counts[key]}</dd>
              </Card>
            ))}
          </dl>
        ) : (
          <p className="text-body-m opacity-60">{t("system.rowsUnavailable")}</p>
        )}
      </section>
    </Container>
  );
}

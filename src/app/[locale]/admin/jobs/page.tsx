import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { JobPostingsManager } from "@/components/admin/JobPostingsManager";
import { isAdminAuthenticated } from "@/lib/adminSession";
import { listJobPostings } from "@/lib/db";
import { isExpiredJobPosting } from "@/lib/jobPostingStatus";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Admin.jobPostings" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AdminJobPostingsPage({ params }: PageProps) {
  await requireLocale(params);
  if (!(await isAdminAuthenticated())) return <AdminLogin />;

  const t = await getTranslations("Admin");
  const jobs = await listJobPostings();

  // Not expired first (soonest expiry first — the ones a board member is
  // most likely to be about to act on), expired below, most-recently-lapsed
  // first — same "act on what's live, then clean up what's not" ordering
  // /admin/termine already uses for past events.
  // new Date().getTime(), not Date.now() — same pattern
  // AdminCalendarEventsPage (app/[locale]/admin/termine/page.tsx) already
  // uses, since a bare Date.now() call trips the react-hooks/purity lint
  // rule (see lib/calendarEvents.ts's getServerNowMs comment).
  const now = new Date().getTime();
  const active = jobs
    .filter((job) => !isExpiredJobPosting(job.expiresAt, now))
    .sort((a, b) => (a.expiresAt < b.expiresAt ? -1 : 1));
  const expired = jobs.filter((job) => isExpiredJobPosting(job.expiresAt, now));

  return (
    <Container className="flex max-w-4xl flex-col gap-8 py-16">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        title={t("jobPostings.title")}
        lead={t("jobPostings.lead")}
      />
      <JobPostingsManager jobs={[...active, ...expired]} now={now} />
    </Container>
  );
}

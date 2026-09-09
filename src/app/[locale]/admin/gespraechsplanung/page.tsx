import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { InterviewAvailabilityMatrix } from "@/components/admin/InterviewAvailabilityMatrix";
import { isAdminAuthenticated } from "@/lib/adminSession";
import { listApplications, listRecruitingWindows } from "@/lib/db";
import { groupApplicationsBySemester } from "@/lib/adminApplications";
import { generateInterviewSlots } from "@/lib/interviewSlots";
import { buildInterviewAvailabilityMatrix } from "@/lib/interviewAvailabilityMatrix";
import { formatDayLong } from "@/lib/calendarFormat";
import { RawLink } from "@/lib/navigation";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Admin.interviewAvailability" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

const DOWNLOAD_LINK_CLASSES =
  "inline-flex items-center gap-2 rounded-md border border-ink/20 px-4 py-2 text-body-s font-medium transition-colors duration-[var(--duration-fast)] hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2";

export default async function AdminInterviewAvailabilityPage({ params }: PageProps) {
  const locale = await requireLocale(params);
  if (!(await isAdminAuthenticated())) return <AdminLogin />;

  const t = await getTranslations("Admin");
  const tMatrix = await getTranslations("Admin.interviewAvailability");
  const [applications, windows] = await Promise.all([listApplications(), listRecruitingWindows()]);
  const groups = groupApplicationsBySemester(applications);

  return (
    <Container className="flex max-w-6xl flex-col gap-12 py-16">
      <SectionHeading as="h1" eyebrow={t("eyebrow")} title={tMatrix("title")} lead={tMatrix("lead")} />

      {groups.length === 0 && <p className="text-body-m opacity-60">{tMatrix("empty")}</p>}

      {groups.map((group) => {
        const window = windows.find((candidate) => candidate.semester === group.semester);
        const configuredSlots = window
          ? generateInterviewSlots({
              days: window.interviewDays,
              startTime: window.interviewStartTime,
              endTime: window.interviewEndTime,
              slotMinutes: window.interviewSlotMinutes,
            })
          : [];
        const matrix = buildInterviewAvailabilityMatrix(
          configuredSlots,
          group.applications.map((application) => ({
            id: application.id,
            name: `${application.firstName} ${application.lastName}`,
            interviewSlots: application.interviewSlots,
          })),
        );

        return (
          <section key={group.semester} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-3">
              <h2 className="text-heading-3 font-display font-normal!">{group.semester}</h2>
              <RawLink
                href={`/api/admin/gespraechsplanung/csv?semester=${encodeURIComponent(group.semester)}`}
                className={DOWNLOAD_LINK_CLASSES}
              >
                {tMatrix("downloadCsv")}
              </RawLink>
            </div>

            {configuredSlots.length === 0 && (
              <p
                role="status"
                className="flex items-start gap-3 rounded-md border border-amber bg-amber/10 p-4 text-body-s"
              >
                <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>{tMatrix("noWindowConfigured")}</span>
              </p>
            )}

            <InterviewAvailabilityMatrix
              matrix={matrix}
              captionLabel={tMatrix("captionLabel")}
              applicantColumnLabel={tMatrix("applicantColumnLabel")}
              totalColumnLabel={tMatrix("totalColumnLabel")}
              totalsRowLabel={tMatrix("totalsRowLabel")}
              noAnswerLabel={tMatrix("noAnswerLabel")}
              noneChosenLabel={tMatrix("noneChosenLabel")}
              notConfiguredLabel={tMatrix("notConfiguredLabel")}
              availableLabel={tMatrix("availableLabel")}
              notAvailableLabel={tMatrix("notAvailableLabel")}
              dayHeading={(day) => formatDayLong(day, locale)}
            />
          </section>
        );
      })}
    </Container>
  );
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RawLink } from "@/lib/navigation";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminTable } from "@/components/admin/AdminTable";
import { MailStatusIndicator } from "@/components/admin/StatusIndicator";
import { isAdminAuthenticated } from "@/lib/adminSession";
import { listIdeathonSignups } from "@/lib/db";
import { siteDateTimeFormatter } from "@/lib/formatSiteDateTime";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Admin.ideathonSignups" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

const DOWNLOAD_LINK_CLASSES =
  "inline-flex items-center gap-2 rounded-md border border-ink/20 px-4 py-2 text-body-s font-medium transition-colors duration-[var(--duration-fast)] hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2";

export default async function AdminIdeathonSignupsPage({ params }: PageProps) {
  await requireLocale(params);
  if (!(await isAdminAuthenticated())) return <AdminLogin />;

  const t = await getTranslations("Admin");
  const signups = await listIdeathonSignups();
  // Pinned to Europe/Berlin — a server component runs on Vercel's own UTC.
  const dateFormatter = siteDateTimeFormatter("de-DE", { dateStyle: "medium", timeStyle: "short" });

  return (
    <Container className="flex max-w-4xl flex-col gap-8 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          as="h1"
          eyebrow={t("eyebrow")}
          title={t("ideathonSignups.title")}
          lead={t("ideathonSignups.lead")}
        />
        <RawLink href="/api/admin/ideathon-anmeldungen/csv" className={DOWNLOAD_LINK_CLASSES}>
          {t("ideathonSignups.downloadCsv")}
        </RawLink>
      </div>

      <AdminTable
        minWidthClassName="min-w-[1180px]"
        columns={[
          t("ideathonSignups.columns.name"),
          t("ideathonSignups.columns.email"),
          t("ideathonSignups.columns.studyProgram"),
          t("ideathonSignups.columns.idea"),
          t("ideathonSignups.columns.team"),
          t("ideathonSignups.columns.teamMembers"),
          t("ideathonSignups.columns.motivationExperience"),
          t("ideathonSignups.columns.dietaryPreference"),
          t("ideathonSignups.columns.createdAt"),
          t("ideathonSignups.columns.mailStatus"),
          t("ideathonSignups.columns.actions"),
        ]}
        empty={t("ideathonSignups.empty")}
        rows={signups.map((signup) => ({
          key: signup.id,
          cells: [
            `${signup.firstName} ${signup.lastName}`,
            signup.email,
            signup.studyProgram,
            t(signup.hasIdea ? "ideathonSignups.yes" : "ideathonSignups.no"),
            signup.registeringAsTeam
              ? t("ideathonSignups.teamOfSize", { size: signup.teamSize ?? "?" })
              : t("ideathonSignups.no"),
            signup.teamMembers ? (
              <span key="teamMembers" className="block max-w-[16rem] truncate" title={signup.teamMembers}>
                {signup.teamMembers}
              </span>
            ) : (
              "–"
            ),
            signup.motivationExperience ? (
              <span
                key="motivationExperience"
                className="block max-w-[16rem] truncate"
                title={signup.motivationExperience}
              >
                {signup.motivationExperience}
              </span>
            ) : (
              "–"
            ),
            t(`ideathonSignups.dietary.${signup.dietaryPreference}`),
            dateFormatter.format(signup.createdAt),
            <MailStatusIndicator
              key="mailStatus"
              status={signup.mailStatus}
              label={t(`mailStatus.${signup.mailStatus}`)}
            />,
            <AdminDeleteButton
              key="actions"
              endpoint="/api/admin/ideathon-anmeldungen"
              id={signup.id}
              confirmLabel={t("ideathonSignups.confirmDelete", {
                name: `${signup.firstName} ${signup.lastName}`,
                email: signup.email,
              })}
            />,
          ],
        }))}
      />
    </Container>
  );
}

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
import { listApplications } from "@/lib/db";
import { groupApplicationsBySemester } from "@/lib/adminApplications";
import { siteDateTimeFormatter } from "@/lib/formatSiteDateTime";

type PageProps = { params: Promise<{ locale: string }> };

// Board-internal tooling, never crawlable: noindex here, and excluded from
// robots.ts's allow list and from sitemap.ts entirely (it's never added to
// EXTRA_PATHS there).
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Admin.applications" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

const DOWNLOAD_LINK_CLASSES =
  "inline-flex items-center gap-2 rounded-md border border-ink/20 px-4 py-2 text-body-s font-medium transition-colors duration-[var(--duration-fast)] hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2";

export default async function AdminBewerbungenPage({ params }: PageProps) {
  await requireLocale(params);
  // Before any query, not after: an unauthenticated request must not reach
  // listApplications() at all (lib/adminSession.ts).
  if (!(await isAdminAuthenticated())) return <AdminLogin />;

  const t = await getTranslations("Admin");
  const applications = await listApplications();
  const groups = groupApplicationsBySemester(applications);
  // Pinned to Europe/Berlin — a server component runs on Vercel's own UTC,
  // so this used to show the board a submission time up to two hours off.
  const dateFormatter = siteDateTimeFormatter("de-DE", { dateStyle: "medium", timeStyle: "short" });

  const columns = [
    t("applications.columns.name"),
    t("applications.columns.email"),
    t("applications.columns.studyProgram"),
    t("applications.columns.createdAt"),
    t("applications.columns.mailStatus"),
    t("applications.columns.cv"),
    t("applications.columns.actions"),
  ];

  return (
    <Container className="flex max-w-4xl flex-col gap-12 py-16">
      <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("applications.title")} />

      {groups.length === 0 && <p className="text-body-m opacity-60">{t("applications.empty")}</p>}

      {groups.map((group) => (
        <section key={group.semester} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-3">
            <h2 className="text-heading-3 font-display font-normal!">{group.semester}</h2>
            <RawLink
              href={`/api/admin/bewerbungen/csv?semester=${encodeURIComponent(group.semester)}`}
              className={DOWNLOAD_LINK_CLASSES}
            >
              {t("applications.downloadCsv")}
            </RawLink>
          </div>

          <AdminTable
            columns={columns}
            empty={t("applications.empty")}
            rows={group.applications.map((application) => ({
              key: application.id,
              cells: [
                `${application.firstName} ${application.lastName}`,
                application.email,
                application.studyProgram,
                dateFormatter.format(application.createdAt),
                <MailStatusIndicator
                  key="mailStatus"
                  status={application.mailStatus}
                  label={t(`mailStatus.${application.mailStatus}`)}
                />,
                application.cvPathname ? (
                  <span key="cv" className="flex flex-col items-start gap-1">
                    <RawLink
                      href={`/api/admin/bewerbungen/${application.id}/cv`}
                      className="link-underline text-body-s"
                    >
                      {t("applications.cvDownload")}
                    </RawLink>
                    {/* Reuses AdminDeleteButton by giving it a compound
                        "id" — the component only ever interpolates this
                        into `${endpoint}/${id}`, so `${id}/cv` targets the
                        CV-only DELETE route without a second, near-
                        identical button component. */}
                    <AdminDeleteButton
                      endpoint="/api/admin/bewerbungen"
                      id={`${application.id}/cv`}
                      label={t("applications.cvRemove")}
                      confirmLabel={t("applications.confirmRemoveCv", {
                        name: `${application.firstName} ${application.lastName}`,
                      })}
                    />
                  </span>
                ) : (
                  <span key="cv" className="text-body-s opacity-60">
                    {t("applications.cvNone")}
                  </span>
                ),
                <AdminDeleteButton
                  key="actions"
                  endpoint="/api/admin/bewerbungen"
                  id={application.id}
                  confirmLabel={t("applications.confirmDelete", {
                    name: `${application.firstName} ${application.lastName}`,
                    email: application.email,
                  })}
                />,
              ],
            }))}
          />
        </section>
      ))}
    </Container>
  );
}

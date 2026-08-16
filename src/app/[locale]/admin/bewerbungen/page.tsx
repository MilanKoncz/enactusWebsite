import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RawLink } from "@/lib/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { ADMIN_SESSION_COOKIE, verifySessionCookieValue } from "@/lib/adminAuth";
import { listApplications } from "@/lib/db";
import { groupApplicationsBySemester } from "@/lib/adminApplications";

type PageProps = { params: Promise<{ locale: string }> };

// Board-internal tooling, never crawlable: noindex here, and excluded from
// robots.ts's allow list and from sitemap.ts entirely (it's never added to
// EXTRA_PATHS there).
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "AdminBewerbungen" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

const DOWNLOAD_LINK_CLASSES =
  "inline-flex items-center gap-2 rounded-md border border-ink/20 px-4 py-2 text-body-s font-medium transition-colors duration-[var(--duration-fast)] hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2";

export default async function AdminBewerbungenPage({ params }: PageProps) {
  await requireLocale(params);
  const t = await getTranslations("AdminBewerbungen");

  const cookieStore = await cookies();
  const authenticated = verifySessionCookieValue(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!authenticated) {
    return (
      <Container className="flex flex-col gap-10 py-24">
        <SectionHeading as="h1" eyebrow={t("login.eyebrow")} title={t("login.title")} />
        <AdminLoginForm />
      </Container>
    );
  }

  const applications = await listApplications();
  const groups = groupApplicationsBySemester(applications);
  const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

  return (
    <Container className="flex flex-col gap-12 py-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} />
        <AdminLogoutButton />
      </div>

      {groups.length === 0 && <p className="text-body-m opacity-60">{t("noApplications")}</p>}

      {groups.map((group) => (
        <section key={group.semester} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-3">
            <h2 className="text-heading-3 font-display">{group.semester}</h2>
            <RawLink
              href={`/api/admin/bewerbungen/csv?semester=${encodeURIComponent(group.semester)}`}
              className={DOWNLOAD_LINK_CLASSES}
            >
              {t("downloadCsv")}
            </RawLink>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-body-s">
              <thead>
                <tr className="border-b border-ink/10 text-left">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    {t("columns.name")}
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    {t("columns.email")}
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    {t("columns.studyProgram")}
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    {t("columns.createdAt")}
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    {t("columns.mailStatus")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.applications.map((application) => (
                  <tr key={application.id} className="border-b border-ink/5">
                    <td className="py-2 pr-4">
                      {application.firstName} {application.lastName}
                    </td>
                    <td className="py-2 pr-4">{application.email}</td>
                    <td className="py-2 pr-4">{application.studyProgram}</td>
                    <td className="py-2 pr-4">{dateFormatter.format(application.createdAt)}</td>
                    <td className="py-2">{t(`mailStatus.${application.mailStatus}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </Container>
  );
}

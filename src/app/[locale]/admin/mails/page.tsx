import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminTable } from "@/components/admin/AdminTable";
import { ResendMailButton } from "@/components/admin/ResendMailButton";
import { isAdminAuthenticated } from "@/lib/adminSession";
import { listFailedMails } from "@/lib/db";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Admin.failedMails" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

// The section the whole "store first, mail second" design depends on. The
// architecture deliberately keeps a submission even when Resend is down
// (docs/engineering.md) — but until this page existed, the only way to
// discover such a row was to query mail_status by hand, so a failed send
// was recorded and then never noticed.
export default async function AdminFailedMailsPage({ params }: PageProps) {
  await requireLocale(params);
  if (!(await isAdminAuthenticated())) return <AdminLogin />;

  const t = await getTranslations("Admin");
  const failed = await listFailedMails();
  const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

  return (
    <Container className="flex max-w-4xl flex-col gap-8 py-16">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        title={t("failedMails.title")}
        lead={t("failedMails.lead")}
      />

      <AdminTable
        minWidthClassName="min-w-[760px]"
        columns={[
          t("failedMails.columns.source"),
          t("failedMails.columns.record"),
          t("failedMails.columns.createdAt"),
          t("failedMails.columns.error"),
          t("failedMails.columns.action"),
        ]}
        empty={t("failedMails.empty")}
        rows={failed.map((entry) => ({
          key: `${entry.source}:${entry.id}`,
          cells: [
            t(`failedMails.sources.${entry.source}`),
            <span key="record" className="flex flex-col">
              <span>{entry.email}</span>
              {entry.label && <span className="opacity-60">{entry.label}</span>}
            </span>,
            dateFormatter.format(entry.createdAt),
            // The provider's own message, never anything a visitor typed —
            // see listFailedMails' comment on why it's safe to show and
            // useless to withhold.
            <span key="error" className="font-mono text-mono-s opacity-80">
              {entry.mailError ?? "—"}
            </span>,
            <ResendMailButton key="resend" source={entry.source} id={entry.id} />,
          ],
        }))}
      />
    </Container>
  );
}

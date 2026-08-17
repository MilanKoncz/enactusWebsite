import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminTable } from "@/components/admin/AdminTable";
import { isAdminAuthenticated } from "@/lib/adminSession";
import { listContactMessages } from "@/lib/db";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Admin.contactMessages" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

// Read-only on purpose: the enquiry itself lives in the mailbox it was
// forwarded to, and this page answers the question that mailbox can't —
// whether the forward actually happened. The message body is deliberately
// not selected (see listContactMessages).
export default async function AdminContactMessagesPage({ params }: PageProps) {
  await requireLocale(params);
  if (!(await isAdminAuthenticated())) return <AdminLogin />;

  const t = await getTranslations("Admin");
  const messages = await listContactMessages();
  const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

  return (
    <Container className="flex max-w-4xl flex-col gap-8 py-16">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        title={t("contactMessages.title")}
        lead={t("contactMessages.lead")}
      />

      <AdminTable
        columns={[
          t("contactMessages.columns.createdAt"),
          t("contactMessages.columns.sender"),
          t("contactMessages.columns.subject"),
          t("contactMessages.columns.mailStatus"),
        ]}
        empty={t("contactMessages.empty")}
        rows={messages.map((message) => ({
          key: message.id,
          cells: [
            dateFormatter.format(message.createdAt),
            <span key="sender" className="flex flex-col">
              <span>{message.name}</span>
              <span className="opacity-60">{message.email}</span>
            </span>,
            message.subject ?? "—",
            t(`mailStatus.${message.mailStatus}`),
          ],
        }))}
      />
    </Container>
  );
}

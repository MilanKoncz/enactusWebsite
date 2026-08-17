import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { DeletionRequestTool } from "@/components/admin/DeletionRequestTool";
import { isAdminAuthenticated } from "@/lib/adminSession";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Admin.deletionRequests" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

// Nothing is queried on render: unlike every other section, this page has
// nothing to show until the board enters a specific address. That's
// deliberate — it's a lookup for a named person exercising their rights,
// not a browsable list of everyone's data.
export default async function AdminDeletionRequestsPage({ params }: PageProps) {
  await requireLocale(params);
  if (!(await isAdminAuthenticated())) return <AdminLogin />;

  const t = await getTranslations("Admin");

  return (
    <Container className="flex max-w-4xl flex-col gap-8 py-16">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        title={t("deletionRequests.title")}
        lead={t("deletionRequests.lead")}
      />
      <DeletionRequestTool />
    </Container>
  );
}

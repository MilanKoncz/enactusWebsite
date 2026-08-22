import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { ProjectAreasManager } from "@/components/admin/ProjectAreasManager";
import { isAdminAuthenticated } from "@/lib/adminSession";
import { listProjectAreas } from "@/lib/db";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Admin.projectAreas" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AdminProjectAreasPage({ params }: PageProps) {
  await requireLocale(params);
  if (!(await isAdminAuthenticated())) return <AdminLogin />;

  const t = await getTranslations("Admin");
  const areas = await listProjectAreas();

  return (
    <Container className="flex max-w-4xl flex-col gap-8 py-16">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        title={t("projectAreas.title")}
        lead={t("projectAreas.lead")}
      />
      <ProjectAreasManager areas={areas} />
    </Container>
  );
}

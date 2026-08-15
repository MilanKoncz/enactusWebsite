import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { ProjectsArchive } from "@/components/sections/ProjectsArchive";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "ProjectsArchivePage" });
  return { title: t("title") };
}

export default async function ProjectsArchivePage({ params }: PageProps) {
  await requireLocale(params);

  return <ProjectsArchive />;
}

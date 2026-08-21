import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { pageAlternates } from "@/lib/seo";
import { ProjectsIntro } from "@/components/sections/ProjectsIntro";
import { ProjectsActive } from "@/components/sections/ProjectsActive";
import { ProjectsStars } from "@/components/sections/ProjectsStars";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Routes" });
  const tSeo = await getTranslations({ locale, namespace: "Seo" });
  return {
    title: t("projekte"),
    description: tSeo("projekte"),
    alternates: pageAlternates("/projekte", locale),
  };
}

export default async function ProjectsPage({ params }: PageProps) {
  await requireLocale(params);

  return (
    <>
      <ProjectsIntro />
      <ProjectsActive />
      <ProjectsStars />
    </>
  );
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { JobsSection } from "@/components/sections/JobsSection";
import { getJobPostings } from "@/lib/jobPostings";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "Routes" });
  return { title: t("jobs") };
}

// Always reachable and in the sitemap, even with zero postings — the brief:
// "Die Seite selbst ist immer erreichbar." Only the nav/footer link is
// conditional (see the site layout's own comment); this page never checks
// that flag itself.
export default async function JobsPage({ params }: PageProps) {
  await requireLocale(params);
  const jobs = await getJobPostings();

  return <JobsSection jobs={jobs} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireLocale, resolveLocale } from "@/i18n/requireLocale";
import { pageAlternates } from "@/lib/seo";
import { ProjectDetailPage } from "@/components/sections/ProjectDetailPage";
import { projects } from "@/content/projects";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

// One entry per project, across both locales — the [locale] segment's own
// generateStaticParams (src/app/[locale]/layout.tsx) supplies the locale
// half, Next.js crosses the two automatically.
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

function findProject(slug: string) {
  return projects.find((project) => project.slug === slug) ?? null;
}

// project.slug is a validated string, not a literal union — same cast
// pattern as ProjectDetailContent.tsx's ProjectCopyKey.
type ProjectCopyKey = Parameters<Awaited<ReturnType<typeof getTranslations<"Projects">>>>[0];

// The placeholder sentinel content/projects.ts's oneLiner falls back to for
// an archive project with no real teaser yet (messages/{locale}.json) —
// checked so a meta description never leaks "ANREISSER_FEHLT" into a
// search snippet or share card; the visible page still shows it through
// PlaceholderMark, same as everywhere else that convention applies.
const ONE_LINER_PLACEHOLDER: Record<"de" | "en", string> = {
  de: "ANREISSER_FEHLT",
  en: "TEASER_MISSING",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const project = findProject(slug);
  if (!project) return {};

  const t = await getTranslations({ locale, namespace: "Projects" });
  const tSeo = await getTranslations({ locale, namespace: "Seo" });
  const oneLiner = t(`${project.slug}.oneLiner` as ProjectCopyKey);
  const description = oneLiner === ONE_LINER_PLACEHOLDER[locale] ? tSeo("projektFallback") : oneLiner;

  return {
    title: project.name,
    description,
    // The concrete slug, not the "/projekte/[slug]" template string —
    // localizedPath only translates the locale prefix, it doesn't resolve
    // dynamic segments, so passing the template through would put a
    // literal "[slug]" in the canonical URL.
    alternates: pageAlternates(`/projekte/${project.slug}`, locale),
  };
}

// Stays lean on purpose (see ASSETS-TODO.md / the /projekte brief): every
// project's actual page is ProjectDetailPage.tsx, a Layout-Component shared
// with the archive grid's link targets, so a new content/projects.ts entry
// never needs a new route file.
export default async function ProjectPage({ params }: PageProps) {
  const { locale, slug } = await params;
  await requireLocale(Promise.resolve({ locale }));

  const project = findProject(slug);
  if (!project) notFound();

  return <ProjectDetailPage project={project} />;
}

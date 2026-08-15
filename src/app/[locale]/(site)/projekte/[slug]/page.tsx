import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireLocale } from "@/i18n/requireLocale";
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = findProject(slug);
  return { title: project?.name };
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

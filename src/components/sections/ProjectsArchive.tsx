import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Link } from "@/lib/navigation";
import { projects } from "@/content/projects";

// Every non-active project the initiative has run — a spin-off like
// Differgy gets the same gold "spinoff" Badge fill here as everywhere else
// (Badge.tsx already treats it as a success state distinct from
// "cancelled"), never a special downgraded treatment. The four active
// projects are deliberately excluded: they already appear directly above on
// /projekte, so repeating them here would make this read as a duplicate of
// that page instead of a history — search engines would read it the same
// way. No thread stop here: the brief calls this page "dezent verlinkt"
// (subtly linked) from /projekte, so it stays a lean archive list rather
// than another full section carrying the homepage's signature element.
const archivedProjects = projects.filter((project) => project.status !== "active");

export function ProjectsArchive() {
  const t = useTranslations("ProjectsArchivePage");
  const tStatus = useTranslations("ProjectStatus");
  const tPlaceholder = useTranslations("Placeholder");

  return (
    <Section>
      <Container className="flex flex-col gap-10">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {archivedProjects.map((project) => (
            <li key={project.slug}>
              <Link
                href={{ pathname: "/projekte/[slug]", params: { slug: project.slug } }}
                className="flex h-full flex-col gap-4 rounded-md border border-ink/10 bg-paper p-5 transition-[border-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:border-ink/20 focus-visible:-translate-y-px focus-visible:border-ink/20"
              >
                <div className="relative">
                  {project.logo ? (
                    <span className="relative block w-full aspect-square">
                      <Image src={project.logo} alt="" fill sizes="25vw" className="object-contain p-2" />
                    </span>
                  ) : (
                    <Placeholder kind="Logo" label={project.name} ratio="1 / 1" className="p-2" />
                  )}
                  <Badge status={project.status} className="absolute right-2 top-2">
                    {tStatus(project.status)}
                  </Badge>
                </div>
                <div className="flex flex-1 flex-col justify-end gap-1">
                  <p className="text-body-l font-medium">{project.name}</p>
                  {project.year ? (
                    <p className="font-mono text-mono-xs uppercase opacity-60">{project.year}</p>
                  ) : (
                    <PlaceholderMark hint={t("yearMissingHint")} className="w-fit font-mono text-mono-xs uppercase opacity-60">
                      {tPlaceholder("missingLabel")}
                    </PlaceholderMark>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/projekte" className="link-underline w-fit text-body-m opacity-70">
          {t("backLabel")}
        </Link>
      </Container>
    </Section>
  );
}

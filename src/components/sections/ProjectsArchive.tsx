import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Link } from "@/lib/navigation";
import { projects } from "@/content/projects";

// Every project the initiative has run, active or not — a spin-off like
// Differgy gets the same gold "spinoff" Badge fill here as everywhere else
// (Badge.tsx already treats it as a success state distinct from
// "cancelled"), never a special downgraded treatment. No thread stop here:
// the brief calls this page "dezent verlinkt" (subtly linked) from
// /projekte, so it stays a lean archive list rather than another full
// section carrying the homepage's signature element.
export function ProjectsArchive() {
  const t = useTranslations("ProjectsArchivePage");
  const tStatus = useTranslations("ProjectStatus");
  const tPlaceholder = useTranslations("Placeholder");

  return (
    <Section>
      <Container className="flex flex-col gap-10">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {projects.map((project) => (
            <li key={project.slug}>
              <Link
                href={`/projekte/${project.slug}`}
                className="flex flex-col gap-3 rounded-md border border-ink/10 bg-paper p-4 transition-[border-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:border-ink/20 focus-visible:-translate-y-px focus-visible:border-ink/20"
              >
                <Placeholder kind="Logo" label={project.name} ratio="1 / 1" className="p-2" />
                <p className="text-body-m font-medium">{project.name}</p>
                {project.year ? (
                  <p className="font-mono text-mono-xs opacity-60">{project.year}</p>
                ) : (
                  <PlaceholderMark hint={t("yearMissingHint")} className="w-fit font-mono text-mono-xs opacity-60">
                    {tPlaceholder("missingLabel")}
                  </PlaceholderMark>
                )}
                <Badge status={project.status} className="w-fit">
                  {tStatus(project.status)}
                </Badge>
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

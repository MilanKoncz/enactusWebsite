import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Link } from "@/lib/navigation";
import { ProjectDetailContent } from "./ProjectDetailContent";
import type { Project } from "@/content/projects";

export type ProjectDetailPageProps = {
  project: Project;
};

// The layout every /projekte/[slug] page renders through (see that route's
// own comment) — a new project only ever needs a new content/projects.ts
// entry, never a new page file. Reuses ProjectDetailContent, the same
// component the inline card expansion on /projekte renders, so the two
// never show different information about the same project.
export function ProjectDetailPage({ project }: ProjectDetailPageProps) {
  const t = useTranslations("Projects");
  const tRoutes = useTranslations("Routes");
  const tStatus = useTranslations("ProjectStatus");
  const tPage = useTranslations("ProjectsPage.detail");

  type ProjectCopyKey = Parameters<typeof t>[0];

  return (
    <Section>
      <Container className="flex flex-col gap-10">
        <Link href="/projekte" className="link-underline w-fit text-body-s opacity-70">
          {tPage("backLabel")}
        </Link>
        <div className="flex flex-col gap-4">
          <p className="w-fit">
            <span className="sr-only">{tPage("statusHeading")}: </span>
            <Badge status={project.status}>{tStatus(project.status)}</Badge>
          </p>
          <SectionHeading
            as="h1"
            eyebrow={tRoutes("projekte")}
            title={project.name}
            lead={t(`${project.slug}.oneLiner` as ProjectCopyKey)}
          />
        </div>
        <ProjectDetailContent
          project={project}
          labels={{
            leadHeading: tPage("leadHeading"),
            leadMissingHint: tPage("leadMissingHint"),
            photosHeading: tPage("photosHeading"),
            externalLinkLabel: tPage("externalLinkLabel"),
          }}
        />
      </Container>
    </Section>
  );
}

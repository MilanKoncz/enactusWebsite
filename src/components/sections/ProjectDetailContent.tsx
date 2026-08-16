import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import type { Project, ProjectLead } from "@/content/projects";

// Only the four labels that /projekte and /projekte/[slug] word differently
// travel as props. Everything the two pages phrase identically (stage, SDG
// focus, LinkedIn) is read from the shared "ProjectDetail" namespace below,
// rather than threaded through both call sites twice.
export type ProjectDetailLabels = {
  leadHeading: string;
  leadMissingHint: string;
  photosHeading: string;
  externalLinkLabel: string;
};

export type ProjectDetailContentProps = {
  project: Project;
  labels: ProjectDetailLabels;
  className?: string;
};

// How many photo slots a project shows. Projects with fewer real photos fill
// the remainder with Placeholders, so the grid keeps its shape and the gap
// stays visible as a gap rather than silently shrinking.
const PHOTO_COUNT = 3;

// project.slug is a validated string (content/projects.ts), not a literal
// union, so next-intl's typed message keys can't statically confirm it names
// a real "Projects.<slug>.description" entry — cast, same pattern as
// BoardGrid.tsx's BoardBioKey.
type ProjectCopyKey = Parameters<ReturnType<typeof useTranslations<"Projects">>>[0];
type StageCopyKey = Parameters<ReturnType<typeof useTranslations<"Process.steps">>>[0];

function ProjectLeadCard({ lead }: { lead: ProjectLead }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 shrink-0 overflow-hidden rounded-md aspect-3/4">
        {lead.photo ? (
          <Image src={lead.photo} alt={lead.name} fill sizes="64px" className="object-cover" />
        ) : (
          <Placeholder kind="Foto" label={lead.name} ratio="3 / 4" className="size-full p-2" />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-body-m font-medium">{lead.name}</p>
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="link-underline w-fit text-body-s opacity-80">
            {lead.email}
          </a>
        )}
        {lead.linkedinUrl && (
          <a
            href={lead.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`LinkedIn — ${lead.name}`}
            className="link-underline w-fit font-mono text-mono-xs uppercase opacity-70"
          >
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}

// The full detail block — longer description, photos, SDG focus, project
// leads, external links — shared between the inline card expansion
// (ProjectsActive.tsx) and the standalone /projekte/[slug] page, so the two
// never drift into two different renderings of the same data. Real assets
// render where they exist and a Placeholder stands in where they don't (see
// ASSETS-TODO.md), the same convention BoardGrid.tsx established for the
// board's own portraits.
export function ProjectDetailContent({ project, labels, className }: ProjectDetailContentProps) {
  const t = useTranslations("Projects");
  const tShared = useTranslations("ProjectDetail");
  const tStage = useTranslations("Process.steps");
  const tPlaceholder = useTranslations("Placeholder");

  const photoSlots = Array.from({ length: Math.max(PHOTO_COUNT, project.images.length) });

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <p className="max-w-prose text-body-m opacity-80">
        {t(`${project.slug}.description` as ProjectCopyKey)}
      </p>

      {(project.stage || project.sdgs.length > 0) && (
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-16">
          {project.stage && (
            <div className="flex flex-col gap-1">
              <p className="font-mono text-mono-xs uppercase opacity-60">{tShared("stageHeading")}</p>
              <p className="text-body-m">{tStage(`${project.stage}.title` as StageCopyKey)}</p>
            </div>
          )}
          {project.sdgs.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="font-mono text-mono-xs uppercase opacity-60">{tShared("sdgHeading")}</p>
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                {project.sdgs.map((goal) => (
                  <li key={goal} className="text-body-m">
                    <abbr title={tShared("sdgItemLabel", { number: goal })} className="no-underline">
                      SDG {goal}
                    </abbr>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <p className="font-mono text-mono-xs uppercase opacity-60">{labels.photosHeading}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {photoSlots.map((_, index) => {
            const image = project.images[index];
            return image ? (
              <div key={image} className="relative overflow-hidden rounded-md aspect-4/3">
                <Image
                  src={image}
                  alt={project.name}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <Placeholder key={index} kind="Foto" label={project.name} ratio="4 / 3" />
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-mono text-mono-xs uppercase opacity-60">{labels.leadHeading}</p>
        {project.leads.length > 0 ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-10">
            {project.leads.map((lead) => (
              <ProjectLeadCard key={lead.name} lead={lead} />
            ))}
          </div>
        ) : (
          <PlaceholderMark hint={labels.leadMissingHint} className="w-fit text-body-m font-medium">
            {tPlaceholder("missingLabel")}
          </PlaceholderMark>
        )}
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-2">
        {project.externalUrl ? (
          <a
            href={project.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline w-fit text-body-m font-medium"
          >
            {labels.externalLinkLabel}
          </a>
        ) : (
          <PlaceholderMark hint={tPlaceholder("missingHint")} className="w-fit text-body-m font-medium">
            {labels.externalLinkLabel}
          </PlaceholderMark>
        )}
        {project.linkedinUrl && (
          <a
            href={project.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline w-fit text-body-m font-medium"
          >
            {tShared("linkedinLabel")}
          </a>
        )}
      </div>
    </div>
  );
}

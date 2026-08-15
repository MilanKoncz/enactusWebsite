import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import type { Project } from "@/content/projects";

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

const PHOTO_COUNT = 3;

// project.slug is a validated string (content/projects.ts), not a literal
// union, so next-intl's typed message keys can't statically confirm it names
// a real "Projects.<slug>.description" entry — cast, same pattern as
// BoardGrid.tsx's BoardBioKey.
type ProjectCopyKey = Parameters<ReturnType<typeof useTranslations<"Projects">>>[0];

// The full detail block — longer description, three photos, project lead
// with photo and email, external site link — shared between the inline
// card expansion (ProjectsActive.tsx) and the standalone /projekte/[slug]
// page, so the two never drift into two different renderings of the same
// data. No photo, logo, or external URL exists for any project yet (see
// ASSETS-TODO.md), so every visual slot below is unconditionally a
// Placeholder/PlaceholderMark, the same convention BoardGrid.tsx already
// established for the board's own missing portraits and LinkedIn links —
// not a speculative "real asset" branch that has never actually run.
export function ProjectDetailContent({ project, labels, className }: ProjectDetailContentProps) {
  const t = useTranslations("Projects");
  const tPlaceholder = useTranslations("Placeholder");

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <p className="max-w-prose text-body-m opacity-80">
        {t(`${project.slug}.description` as ProjectCopyKey)}
      </p>

      <div className="flex flex-col gap-3">
        <p className="font-mono text-mono-xs uppercase opacity-60">{labels.photosHeading}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: PHOTO_COUNT }, (_, index) => (
            <Placeholder key={index} kind="Foto" label={project.name} ratio="4 / 3" />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Placeholder kind="Foto" label={project.leadName ?? labels.leadHeading} ratio="1 / 1" className="size-20 shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="font-mono text-mono-xs uppercase opacity-60">{labels.leadHeading}</p>
          {project.leadName ? (
            <p className="text-body-m font-medium">{project.leadName}</p>
          ) : (
            <PlaceholderMark hint={labels.leadMissingHint} className="text-body-m font-medium">
              {tPlaceholder("missingLabel")}
            </PlaceholderMark>
          )}
          {project.leadEmail ? (
            <a href={`mailto:${project.leadEmail}`} className="link-underline w-fit text-body-s opacity-80">
              {project.leadEmail}
            </a>
          ) : (
            <PlaceholderMark hint={labels.leadMissingHint} className="text-body-s opacity-80">
              {tPlaceholder("missingLabel")}
            </PlaceholderMark>
          )}
        </div>
      </div>

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
    </div>
  );
}

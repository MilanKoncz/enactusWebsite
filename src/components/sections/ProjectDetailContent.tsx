import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { LinkCard } from "@/components/ui/LinkCard";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { formatDomain } from "@/lib/domain";
import { sdgIconSrc, SDG_GOALS_URL } from "@/content/sdg";
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
type SdgGoalCopyKey = Parameters<ReturnType<typeof useTranslations<"Sdg.goals">>>[0];

function ProjectLeadCard({ lead, unverifiedEmailHint }: { lead: ProjectLead; unverifiedEmailHint: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 shrink-0 overflow-hidden rounded-md aspect-3/4">
        {lead.photo ? (
          <ImageLightbox src={lead.photo} alt={lead.name} triggerClassName="absolute inset-0">
            <Image src={lead.photo} alt={lead.name} fill sizes="64px" className="object-cover" />
          </ImageLightbox>
        ) : (
          <Placeholder kind="Foto" label={lead.name} ratio="3 / 4" className="size-full p-2" />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-body-m font-medium">{lead.name}</p>
        {/* A derived address (emailVerified: false) is still shown — it's
            almost certainly right and useful — but marked as unconfirmed
            rather than presented as fact, same convention as org.ts's
            verified flags. It stays a real mailto: link: a visitor who
            writes to it loses nothing if it bounces, and hiding it would
            leave the lead with no contact route at all.

            `break-all` and no `w-fit`: an address at this domain runs to ~38
            characters with no space to wrap at, so a shrink-proof box pushed
            the whole page sideways at 360px. Mealyo and ImpactWithUs were
            already over by a few pixels before ReSoap's longer address made
            it obvious. Breaking mid-address is a little ugly; a
            horizontally scrolling page is worse and is ruled out by
            CLAUDE.md's quality floor. */}
        {lead.email &&
          (lead.emailVerified ? (
            <a href={`mailto:${lead.email}`} className="link-underline text-body-s break-all opacity-80">
              {lead.email}
            </a>
          ) : (
            <PlaceholderMark variant="unverified" hint={unverifiedEmailHint} className="text-body-s break-all">
              <a href={`mailto:${lead.email}`} className="link-underline opacity-80">
                {lead.email}
              </a>
            </PlaceholderMark>
          ))}
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
  const tSdg = useTranslations("Sdg");
  const tSdgGoals = useTranslations("Sdg.goals");

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
            <div className="flex flex-col gap-2">
              <p className="font-mono text-mono-xs uppercase opacity-60">{tShared("sdgHeading")}</p>
              <ul className="flex flex-col gap-2">
                {project.sdgs.map((goal) => {
                  const name = tSdgGoals(String(goal) as SdgGoalCopyKey);
                  return (
                    <li key={goal} className="flex items-center gap-3">
                      {/* The official icon, unmodified — no crop, no recolor, no
                          distortion, per the UN's own usage guidelines. Decorative
                          (empty alt): the link right next to it already states the
                          same number and name as real text, so the icon would
                          otherwise be announced a second time for no new information. */}
                      <span className="relative size-10 shrink-0">
                        <Image src={sdgIconSrc(goal)} alt="" fill sizes="40px" className="object-contain" />
                      </span>
                      <a
                        href={SDG_GOALS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={tSdg("linkLabel", { number: goal, name })}
                        className="link-underline text-body-m"
                      >
                        SDG {goal} — {name}
                      </a>
                    </li>
                  );
                })}
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
                <ImageLightbox src={image} alt={project.name} triggerClassName="absolute inset-0">
                  <Image
                    src={image}
                    alt={project.name}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover"
                  />
                </ImageLightbox>
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
              <ProjectLeadCard
                key={lead.name}
                lead={lead}
                unverifiedEmailHint={tShared("unverifiedEmailHint")}
              />
            ))}
          </div>
        ) : (
          <PlaceholderMark hint={labels.leadMissingHint} className="w-fit text-body-m font-medium">
            {tPlaceholder("missingLabel")}
          </PlaceholderMark>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
        {project.externalUrl ? (
          <LinkCard
            href={project.externalUrl}
            eyebrow={labels.externalLinkLabel}
            title={formatDomain(project.externalUrl)}
            ariaLabel={`${labels.externalLinkLabel} — ${formatDomain(project.externalUrl)}`}
            className="w-full sm:w-auto sm:min-w-64"
          />
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
            className="link-underline w-fit self-center text-body-m font-medium"
          >
            {tShared("linkedinLabel")}
          </a>
        )}
      </div>
    </div>
  );
}

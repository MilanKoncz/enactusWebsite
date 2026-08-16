"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { ProjectDetailContent } from "./ProjectDetailContent";
import { projects, type Project } from "@/content/projects";

const activeProjects = projects.filter((project) => project.status === "active");

// project.slug is a validated string, not a literal union — see
// ProjectDetailContent.tsx's identical cast.
type ProjectCopyKey = Parameters<ReturnType<typeof useTranslations<"Projects">>>[0];

type ProjectCardProps = {
  project: Project;
  isOpen: boolean;
  onToggle: () => void;
};

// Click/tap/keyboard-Enter, not hover: docs/design-system.md names project
// cards as the one exception where expanding on hover is allowed to hide
// content, but that guidance was written for a panel that floats
// (position: absolute) without disturbing anything else — ProcessTimeline's
// station checklist is the example it shares a codebase with. Here the brief
// asks for the opposite: opening a card visibly reflows the cards below it
// ("andere Karten rutschen sauber nach"), and reflowing the page just
// because a pointer drifted across a card would be worse, not better. A real
// button keeps this keyboard- and touch-operable without extra wiring.
function ProjectCard({ project, isOpen, onToggle }: ProjectCardProps) {
  const t = useTranslations("Projects");
  const tStatus = useTranslations("ProjectStatus");
  const tPage = useTranslations("ProjectsPage.active");
  const panelId = useId();
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.li layout={!reducedMotion} className="list-none rounded-md border border-ink/10 bg-paper">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center gap-4 rounded-md p-6 text-left transition-[background-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:bg-ink/5 focus-visible:-translate-y-px focus-visible:bg-ink/5"
      >
        {project.logo ? (
          <span className="relative size-14 shrink-0">
            <Image src={project.logo} alt="" fill sizes="56px" className="object-contain" />
          </span>
        ) : (
          <Placeholder kind="Logo" label={project.name} ratio="1 / 1" className="size-14 shrink-0 p-2" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-body-l font-medium">
            {project.name}
            <span className="sr-only"> — {isOpen ? tPage("collapseLabel") : tPage("expandLabel")}</span>
          </p>
          <p className="text-body-s opacity-70">{t(`${project.slug}.oneLiner` as ProjectCopyKey)}</p>
        </div>
        <Badge status={project.status} className="shrink-0">
          {tStatus(project.status)}
        </Badge>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-5 shrink-0 transition-transform duration-[var(--duration-fast)] ease-signature",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="overflow-hidden px-6 pb-6"
          >
            <ProjectDetailContent
              project={project}
              labels={{
                leadHeading: tPage("leadHeading"),
                leadMissingHint: tPage("leadMissingHint"),
                photosHeading: tPage("photosHeading"),
                externalLinkLabel: tPage("externalLinkLabel"),
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// The four active projects, stacked vertically as expandable cards — see
// ProjectCard's own comment for why "click expands," not hover. Only one
// card is open at a time (matching ProcessTimeline's station panels), so
// opening a second never leaves two long detail blocks stacked on top of
// each other.
export function ProjectsActive() {
  const t = useTranslations("ProjectsPage.active");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <Section className="relative isolate">
      <ThreadSegment stop="projects-active" />
      <Container className="relative flex flex-col gap-6">
        <p className="font-mono text-mono-xs uppercase opacity-60">{t("heading")}</p>
        <ul className="flex flex-col gap-4">
          {activeProjects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              isOpen={openSlug === project.slug}
              onToggle={() =>
                setOpenSlug((current) => (current === project.slug ? null : project.slug))
              }
            />
          ))}
        </ul>
      </Container>
    </Section>
  );
}

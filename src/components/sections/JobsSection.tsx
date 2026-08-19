"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonClasses } from "@/components/ui/Button";
import { EMPLOYMENT_TYPES } from "@/content/jobs";
import type { EmploymentType, JobPosting } from "@/content/jobs";
import { partners } from "@/content/partners";
import { org } from "@/content/org";
import { cn } from "@/lib/cn";

export type JobsSectionProps = {
  jobs: JobPosting[];
};

function partnerFor(slug: string | null) {
  if (!slug) return null;
  return partners.find((partner) => partner.slug === slug) ?? null;
}

function visibleTypes(jobs: JobPosting[]): EmploymentType[] {
  const present = new Set(jobs.map((job) => job.employmentType));
  return EMPLOYMENT_TYPES.filter((type) => present.has(type));
}

function JobCard({ job }: { job: JobPosting }) {
  const t = useTranslations("JobsPage");
  const tTypes = useTranslations("JobEmploymentTypes");
  const tRemote = useTranslations("JobRemoteOptions");
  const partner = partnerFor(job.partnerSlug);

  return (
    <li className="flex flex-col gap-4 rounded-md border border-ink/10 bg-paper p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-body-l font-medium">{job.title}</p>
          <p className="text-body-s opacity-70">{job.company}</p>
        </div>
        {partner?.logo && (
          <span className="relative h-10 w-20 shrink-0">
            <Image src={partner.logo} alt={partner.name} fill sizes="80px" className="object-contain object-right" />
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-sm border border-ink/20 px-2.5 py-1 font-mono text-mono-xs uppercase">
          {tTypes(job.employmentType)}
        </span>
        <span className="inline-flex items-center rounded-sm border border-ink/20 px-2.5 py-1 font-mono text-mono-xs uppercase">
          {tRemote(job.remote)}
        </span>
        {job.location && (
          <span className="inline-flex items-center rounded-sm border border-ink/20 px-2.5 py-1 font-mono text-mono-xs uppercase">
            {job.location}
          </span>
        )}
      </div>

      {job.description && <p className="text-body-m opacity-80">{job.description}</p>}

      <a
        href={job.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("applyCtaLabel", { title: job.title, company: job.company })}
        className={cn(buttonClasses("secondary", "sm"), "mt-auto self-start")}
      >
        {t("applyCta")}
        <ExternalLink aria-hidden="true" className="size-4" />
      </a>
    </li>
  );
}

// Same shape as EventCalendar.tsx: server-rendered `jobs` for the first
// paint and a client-side re-fetch on mount, both so a board edit at
// /admin/jobs shows up without waiting for the hour-long cache to expire and
// so Playwright has a seam to mock (CLAUDE.md: a value baked into a static
// page at build time can't be intercepted by page.route()).
export function JobsSection({ jobs }: JobsSectionProps) {
  const t = useTranslations("JobsPage");
  const [liveJobs, setLiveJobs] = useState(jobs);
  const [selected, setSelected] = useState<EmploymentType[]>([]);

  useEffect(() => {
    fetch("/api/job-postings")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { jobs?: JobPosting[] } | null) => {
        if (body?.jobs) setLiveJobs(body.jobs);
      })
      .catch(() => {
        // Same reasoning as EventCalendar.tsx's equivalent fetch: left as
        // the server-rendered value, since a same-origin GET failing
        // outright would mean the site itself is unreachable.
      });
  }, []);

  const types = visibleTypes(liveJobs);
  const filtered = selected.length === 0 ? liveJobs : liveJobs.filter((job) => selected.includes(job.employmentType));

  function toggleType(type: EmploymentType) {
    setSelected((previous) => (previous.includes(type) ? previous.filter((t) => t !== type) : [...previous, type]));
  }

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col gap-10">
        {/* /jobs has no separate intro section, same reasoning as
            EventsIntro.tsx / /termine: this carries the page's one h1. */}
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />

        {liveJobs.length === 0 ? (
          // Never hidden — the brief: "Sektion nie verstecken." A visible,
          // friendly invitation for partners to reach out, not a dead end.
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-ink/20 p-8 text-center">
            <p className="text-body-m opacity-70">{t("empty")}</p>
            <p className="text-body-s opacity-60">{t("emptyHint")}</p>
            <a href={`mailto:${org.contactEmails.board}`} className={buttonClasses("secondary", "sm")}>
              {t("emptyCta")}
            </a>
          </div>
        ) : (
          <>
            {types.length > 0 && (
              <div
                role="group"
                aria-label={t("filterLabel")}
                className="flex flex-wrap gap-3"
              >
                {types.map((type) => {
                  const pressed = selected.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={pressed}
                      onClick={() => toggleType(type)}
                      className={cn(
                        "rounded-sm border px-2.5 py-1 font-mono text-mono-xs uppercase transition-transform duration-[var(--duration-fast)] ease-signature hover:-translate-y-px focus-visible:-translate-y-px",
                        pressed ? "border-ink bg-ink/5 ring-2 ring-ink/30 ring-offset-1 ring-offset-paper" : "border-ink/20",
                      )}
                    >
                      <JobTypeLabel type={type} />
                    </button>
                  );
                })}
              </div>
            )}

            {filtered.length === 0 ? (
              <p className="rounded-md border border-dashed border-ink/20 p-6 text-center text-body-m opacity-60">
                {t("emptyFiltered")}
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filtered.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </ul>
            )}
          </>
        )}
      </Container>
    </Section>
  );
}

function JobTypeLabel({ type }: { type: EmploymentType }) {
  const tTypes = useTranslations("JobEmploymentTypes");
  return <>{tTypes(type)}</>;
}

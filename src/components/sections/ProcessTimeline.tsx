"use client";

import { useId, useState } from "react";
import {
  ChevronDown,
  Cog,
  Flag,
  GitBranch,
  Hammer,
  Lightbulb,
  Rocket,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { GateMarker } from "@/components/ui/GateMarker";
import { Section } from "@/components/ui/Section";
import { steps, type IconKey, type Step } from "@/content/process";

// kickOff and ideation have no "Process.steps.<key>.checklist" entry at all
// (content/process.ts's hasChecklist flags them off) — next-intl's generated
// key union can't statically confirm a template-literal lookup names a real
// entry, only step.hasChecklist can, so this stays a runtime-guarded cast,
// same pattern as ProjectDetailContent.tsx's StageCopyKey.
type ChecklistCopyKey = Parameters<ReturnType<typeof useTranslations<"Process">>>[0];

const ICONS: Record<IconKey, LucideIcon> = {
  flag: Flag,
  lightbulb: Lightbulb,
  "git-branch": GitBranch,
  hammer: Hammer,
  "shield-check": ShieldCheck,
  cog: Cog,
  rocket: Rocket,
  "trending-up": TrendingUp,
};

// The panel floats outside its station's own box on transform + opacity
// alone (never width/height/top/left, docs/design-system.md's Interaction
// section) — every station keeps the exact footprint it always had, whether
// its panel is open or not, so opening one never moves a neighbor. Always in
// the accessibility tree, just visually faded and non-interactive until
// opened (same contract as HoverDetail.tsx).
const PANEL_BASE =
  "absolute inset-x-0 top-full z-10 mt-2 flex translate-y-1 flex-col gap-2 rounded-md border border-ink/10 bg-paper p-4 opacity-0 pointer-events-none transition-[opacity,transform] duration-[var(--duration-calm)] ease-signature lg:inset-x-auto lg:w-64";

// The first two and last two stations sit close enough to the track's own
// edges that a panel centered on their column spills past the viewport —
// same edge case tests/e2e/prozess.spec.ts's no-horizontal-scroll check
// guards against. Anchoring those four to the field's near edge instead
// keeps every panel fully on-screen without shrinking it.
function panelHorizontalPosition(index: number, total: number): string {
  if (index <= 1) return "lg:left-0 lg:translate-x-0";
  if (index >= total - 2) return "lg:left-auto lg:right-0 lg:translate-x-0";
  return "lg:left-1/2 lg:-translate-x-1/2";
}

// group-data-[open]:, not a bare group-data-open: — "open" is a custom
// attribute (Station sets data-open below), not one of Tailwind's built-in
// boolean variants, so it needs the arbitrary-value bracket syntax.
const PANEL_OPEN =
  "group-data-[open]:translate-y-0 group-data-[open]:opacity-100 group-data-[open]:pointer-events-auto desktop-hover:group-hover:translate-y-0 desktop-hover:group-hover:opacity-100 desktop-hover:group-hover:pointer-events-auto desktop-hover:group-focus-within:translate-y-0 desktop-hover:group-focus-within:opacity-100 desktop-hover:group-focus-within:pointer-events-auto";

const CHEVRON_CLASSES =
  "size-4 shrink-0 opacity-60 transition-transform duration-[var(--duration-calm)] ease-signature group-data-[open]:rotate-180 desktop-hover:group-hover:rotate-180 desktop-hover:group-focus-within:rotate-180";

// The reserved height every station's marker sits in, ab lg — fixed and
// shared by gates and phases alike so the horizontal spine (positioned at
// this box's vertical center, see the track wrapper below) crosses every
// station's marker at the same y, whether that marker is a full-height gold
// rule or a small dot.
const MARKER_ROW = "lg:flex lg:h-8 lg:w-full lg:min-w-0 lg:items-center lg:justify-center";

// Ab lg the marker sits on a horizontal line: a gate crosses it (GateMarker's
// divider variant — vertical rule, label below, the same shape already used
// for the homepage's gate dividers), a phase gets a calmer dot instead of a
// second gold rule. Below lg the marker sits beside a vertical line instead:
// GateMarker's own milestone variant (rule left, label right) already fits
// that shape unchanged; the phase mirrors it with a dot instead of a rule.
function Marker({ step, title }: { step: Step; title: string }) {
  const isMilestone = step.kind === "milestone";
  return (
    <>
      <div className={cn("hidden", MARKER_ROW)}>
        {isMilestone ? (
          <GateMarker label={title} variant="divider" />
        ) : (
          <span className="flex w-full min-w-0 flex-col items-center gap-3">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-ink/40" />
            <span className="w-full min-w-0 break-words bg-[var(--surface-bg)] px-2 text-center font-mono text-mono-m uppercase [hyphens:auto]">
              {title}
            </span>
          </span>
        )}
      </div>
      <div className="lg:hidden">
        {isMilestone ? (
          <GateMarker label={title} variant="milestone" />
        ) : (
          <span className="flex items-center gap-3">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-ink/40" />
            <span className="whitespace-nowrap font-mono text-mono-s uppercase">{title}</span>
          </span>
        )}
      </div>
    </>
  );
}

function Checklist({ step, checklist }: { step: Step; checklist: string[] }) {
  const t = useTranslations("Process.timeline");
  const isMilestone = step.kind === "milestone";
  return (
    <>
      <p className="font-mono text-mono-xs uppercase opacity-60">
        {isMilestone ? t("criteriaLabel") : t("benefitsLabel")}
      </p>
      <ul className="flex flex-col gap-1.5 text-body-s">
        {checklist.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-ink/40" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

type StationProps = {
  step: Step;
  index: number;
  openKey: string | null;
  onOpen: (key: string) => void;
  onClose: (key: string) => void;
};

function Station({ step, index, openKey, onOpen, onClose }: StationProps) {
  const t = useTranslations("Process");
  const panelId = useId();
  const Icon = ICONS[step.icon];
  const isOpen = openKey === step.key;
  const title = t(`steps.${step.key}.title`);
  const short = t(`steps.${step.key}.short`);
  const checklist = step.hasChecklist
    ? (t.raw(`steps.${step.key}.checklist` as ChecklistCopyKey) as string[])
    : null;
  const kindLabel = step.kind === "milestone" ? t("timeline.milestoneLabel") : t("timeline.phaseLabel");

  const head = (
    <>
      <span className="font-mono text-mono-xs uppercase opacity-60">
        {String(step.order).padStart(2, "0")}
      </span>
      <Marker step={step} title={title} />
    </>
  );

  const chevron = <ChevronDown aria-hidden="true" className={cn(CHEVRON_CLASSES, "lg:mt-1")} />;

  // Below lg the description stays permanently visible next to the station
  // (docs/design-system.md's "hover enhances, hover never hides" — the
  // Ideation timeline is one of the two named exceptions, but only for the
  // part that genuinely saves space, the checklist). Ab lg it moves into the
  // panel instead, because the compressed column only has room for a title.
  const inlineDescription = (
    <span className="flex items-start gap-2 text-body-s opacity-80 lg:hidden">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{short}</span>
    </span>
  );

  const panel = (
    <div
      id={panelId}
      className={cn(PANEL_BASE, panelHorizontalPosition(index, steps.length), PANEL_OPEN)}
    >
      <p className="hidden text-body-s opacity-80 lg:block">{short}</p>
      {checklist && <Checklist step={step} checklist={checklist} />}
    </div>
  );

  const wrapperClasses = "group relative flex flex-col items-start gap-2 lg:items-center";

  if (!step.hasChecklist) {
    // No checklist and, below lg, no panel at all — a station with nothing to
    // disclose renders as a plain block there: no hover treatment, no
    // chevron, no button semantics, so it's never mistaken for a broken
    // control. Ab lg it still becomes a real button (see the file comment on
    // ProcessTimeline): the description moved into the panel for every
    // station there, this one included.
    return (
      <div className={wrapperClasses} style={{ gridColumn: `${index + 1} / span 1` }} data-open={isOpen ? "" : undefined}>
        <div className="flex w-full flex-col items-start gap-2 lg:hidden">
          {head}
          {inlineDescription}
        </div>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => onOpen(step.key)}
          onFocus={() => onOpen(step.key)}
          onBlur={() => onClose(step.key)}
          className="hidden w-full flex-col items-center gap-2 rounded-md p-2 text-center transition-[background-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:bg-ink/5 focus-visible:-translate-y-px focus-visible:bg-ink/5 lg:flex"
        >
          <span className="sr-only">{`${kindLabel}: ${title}`}</span>
          <span aria-hidden="true" className="contents">
            {head}
          </span>
          {chevron}
        </button>
        {panel}
      </div>
    );
  }

  return (
    <div className={wrapperClasses} style={{ gridColumn: `${index + 1} / span 1` }} data-open={isOpen ? "" : undefined}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => onOpen(step.key)}
        onFocus={() => onOpen(step.key)}
        onBlur={() => onClose(step.key)}
        className="flex w-full flex-col items-start gap-2 rounded-md p-2 text-left transition-[background-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:bg-ink/5 focus-visible:-translate-y-px focus-visible:bg-ink/5 lg:items-center lg:text-center"
      >
        <span className="sr-only">{`${kindLabel}: ${title}`}</span>
        <span aria-hidden="true" className="contents">
          {head}
        </span>
        {chevron}
      </button>
      {inlineDescription}
      {panel}
    </div>
  );
}

// Every station sits directly on a single continuous gold line — the spine
// — horizontal ab lg, vertical below it: the same content, the same
// components (GateMarker unchanged), just rotated, never a second line
// mechanism. This used to be the golden thread's job (ThreadSegment.tsx),
// but that motif is homepage-only since 2026-08-16 and was never built for a
// fixed, discrete sequence — a straight rule carries the exact same gold
// motif without a second, scroll-bound path mechanism next to it. Unlike the
// thread, this line renders at every breakpoint: it is the page's content,
// not decoration, so it never gets the thread's `hidden md:block` treatment.
export function ProcessTimeline() {
  const t = useTranslations("Process");
  const [openKey, setOpenKey] = useState<string | null>(null);

  function open(key: string) {
    setOpenKey(key);
  }

  function close(key: string) {
    setOpenKey((current) => (current === key ? null : current));
  }

  return (
    <Section className="relative isolate">
      <Container>
        <div
          role="group"
          aria-label={t("timeline.regionLabel")}
          className="relative isolate flex flex-col gap-10 py-20 lg:grid lg:grid-cols-8 lg:items-start lg:gap-x-2 lg:gap-y-0 lg:py-24"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gold lg:hidden"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-24 hidden h-[2px] -translate-y-1/2 bg-gold lg:block"
          />
          {steps.map((step, index) => (
            <Station key={step.key} step={step} index={index} openKey={openKey} onOpen={open} onClose={close} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

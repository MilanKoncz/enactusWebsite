"use client";

import { useCallback, useState, useId, useSyncExternalStore } from "react";
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
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
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

const CHEVRON_CLASSES =
  "size-4 shrink-0 opacity-60 transition-transform duration-[var(--duration-calm)] ease-signature";

// useSyncExternalStore, not a useEffect + setState pair — a synchronous
// setState-on-mount effect trips the react-hooks/set-state-in-effect lint
// rule for exactly the cascading-render reason that rule exists (same
// rationale as useMediaQuery.ts). getServerSnapshot returns false so the
// very first client render matches SSR exactly (no hydration mismatch) —
// which also means the server-rendered markup itself renders every station
// permanently open (see ProcessTimeline's `enhanced` below), the same safe
// state a reader with JavaScript disabled is stuck with forever.
function useHasMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// A gate is a Zeitpunkt — GateMarker's own rule is bound to a single text
// row's height (min-h-8, ~32px) and stays untouched here, still the site's
// one gate motif (docs/design-system.md). A phase has duration, so it gets
// its own, deliberately different mark: a muted bar roughly 2.5x that
// height (h-20, 80px) rather than a literal swap of the two shapes — gold
// stays reserved for gates, so the phase bar reads as "a stretch of the
// line" without competing with the signature motif. Both are legible by
// shape alone, not only by color.
function Marker({ step, title }: { step: Step; title: string }) {
  if (step.kind === "milestone") {
    return <GateMarker label={title} variant="milestone" />;
  }
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden="true" className="h-20 w-[2px] shrink-0 bg-ink/40" />
      <span className="whitespace-nowrap font-mono text-mono-s uppercase">{title}</span>
    </span>
  );
}

// Numeral and marker used to stack in a column for a plain (no-checklist)
// station but sit side by side for a button-wrapped one — an accident of
// two different wrapper elements, not a deliberate difference. Sharing one
// row layout keeps every station's marker the same distance from the
// timeline spine regardless of whether it renders as a button.
function StationHead({ step, title }: { step: Step; title: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="font-mono text-mono-xs uppercase opacity-60">
        {String(step.order).padStart(2, "0")}
      </span>
      <Marker step={step} title={title} />
    </span>
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
  enhanced: boolean;
  manuallyOpen: boolean;
  onToggle: (key: string) => void;
};

// A station with a checklist opens and closes only on click or keyboard
// activation — no scroll-driven auto-reveal, board feedback 2026-08-19 (it
// read as the page acting on its own). `enhanced` is false before the
// client has mounted or under prefers-reduced-motion — in both cases the
// station renders permanently open (see isOpen below), which is also
// exactly what the server-rendered markup already looks like before any
// client JS runs, so a no-JS reader never loses access to the content.
function Station({ step, enhanced, manuallyOpen, onToggle }: StationProps) {
  const t = useTranslations("Process");
  const panelId = useId();
  const Icon = ICONS[step.icon];
  const title = t(`steps.${step.key}.title`);
  const short = t(`steps.${step.key}.short`);
  const checklist = step.hasChecklist
    ? (t.raw(`steps.${step.key}.checklist` as ChecklistCopyKey) as string[])
    : null;
  const kindLabel = step.kind === "milestone" ? t("timeline.milestoneLabel") : t("timeline.phaseLabel");
  const isOpen = !enhanced || manuallyOpen;

  const description = (
    <span className="flex items-start gap-2 pl-9 text-body-s opacity-80">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{short}</span>
    </span>
  );

  if (!checklist) {
    // Nothing to disclose — kickOff and ideation render as a plain block,
    // no button and no chevron, so they never read as a broken control.
    return (
      <div className="relative flex flex-col items-start gap-2">
        <StationHead step={step} title={title} />
        {description}
      </div>
    );
  }

  return (
    <div data-open={isOpen ? "" : undefined} className="relative flex flex-col items-start gap-2">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => onToggle(step.key)}
        className="flex w-full items-center gap-2 rounded-md py-2 pr-2 text-left transition-[background-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:bg-ink/5 focus-visible:-translate-y-px focus-visible:bg-ink/5"
      >
        <span className="sr-only">{`${kindLabel}: ${title}`}</span>
        <span aria-hidden="true" className="flex flex-1 items-center gap-2">
          <StationHead step={step} title={title} />
        </span>
        <ChevronDown aria-hidden="true" className={cn(CHEVRON_CLASSES, isOpen && "rotate-180")} />
      </button>
      {description}
      {/* The 0fr/1fr grid-template-rows trick (globals.css) collapses and
          expands this without ever animating a literal `height` (motion
          rule 5) and without measuring the content's real height in JS —
          the inner div's `overflow: hidden` is what actually clips it
          during the collapsed state; the trick doesn't work without it. */}
      <div id={panelId} className="station-panel w-full">
        <div className="flex w-full flex-col gap-2 pl-9 pt-2">
          <Checklist step={step} checklist={checklist} />
        </div>
      </div>
    </div>
  );
}

// Every station sits directly on a single continuous gold line — the spine
// — running vertically at every breakpoint. This used to switch to a
// horizontal spine ab lg (the golden thread's job before that, then a
// dedicated horizontal variant); board feedback, 2026-08-19, was that the
// horizontal arrangement didn't read well, so vertical is now the only
// layout, matching the mobile treatment this component always had.
//
// The spine is `absolute` with `top-0 bottom-0` against this relatively
// positioned group, not a measured height — it already tracks the group's
// rendered height through ordinary layout, so a station opening (pushing
// later stations down through the station-panel grid trick) or closing
// changes the group's height and the spine's bottom edge moves with it for
// free, no JS involved.
//
// A station with a checklist takes real layout space once open — a click
// expands the checklist in normal flow, pushing later stations down,
// rather than floating it over them. The previous "never moves a neighbor"
// floating-panel technique assumed at most one station was ever open at a
// time (a strict accordion); this component no longer enforces that — a
// reader can open several at once — so a floating panel from an earlier
// station would then overlap a later one's own content instead of just
// sitting quietly below it.
export function ProcessTimeline() {
  const t = useTranslations("Process");
  const prefersReducedMotion = usePrefersReducedMotion();
  const hasMounted = useHasMounted();
  const [manuallyOpenKeys, setManuallyOpenKeys] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = useCallback((key: string) => {
    setManuallyOpenKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Enhanced (closed-by-default) only once the client has mounted and
  // confirmed motion is allowed — every other case, including the render
  // before that's confirmed, falls back to permanently open, which is
  // exactly what a no-JS reader's server-rendered markup already looks
  // like, since that fallback needs no script to take effect.
  const enhanced = hasMounted && !prefersReducedMotion;

  return (
    // Own, deliberately smaller rhythm than Section's default py-16/24: this
    // page has no hero, so ProcessIntro's heading and ProjectGuideDownload's
    // follow-up sit right above/below with nothing else competing for
    // attention — the full default gap plus the group's own inner padding
    // (removed below, it duplicated this Section's job) stacked into
    // visible dead air the timeline had to swim in.
    <Section className="relative isolate py-10 md:py-14">
      <Container>
        <div
          role="group"
          aria-label={t("timeline.regionLabel")}
          className="relative isolate flex flex-col gap-10"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gold"
          />
          {steps.map((step) => (
            <Station
              key={step.key}
              step={step}
              enhanced={enhanced}
              manuallyOpen={manuallyOpenKeys.has(step.key)}
              onToggle={toggle}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, useId, useSyncExternalStore } from "react";
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

function Marker({ step, title }: { step: Step; title: string }) {
  if (step.kind === "milestone") {
    return <GateMarker label={title} variant="milestone" />;
  }
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-ink/40" />
      <span className="whitespace-nowrap font-mono text-mono-s uppercase">{title}</span>
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
  seen: boolean;
  onToggle: (key: string) => void;
  registerNode: (key: string, node: HTMLDivElement | null) => void;
};

// A station with a checklist opens on its own once it reaches the viewport
// and then stays open for the rest of the visit — `seen` is a one-way
// latch, never cleared, so scrolling back up past a station never
// re-collapses it. `manuallyOpen` is the independent keyboard/screen-reader
// path to the same state, so neither depends on the reader's scroll
// position. `enhanced` is false before the component has mounted or under
// prefers-reduced-motion — in both cases the station renders permanently
// open (see the isOpen computation below), which is also exactly what the
// server-rendered markup already looks like before any client JS runs.
//
// The intersection watching itself lives one level up, in ProcessTimeline —
// a single shared IntersectionObserver watching every station's node,
// rather than one instance per station. `registerNode` is only how a
// station hands its DOM node to that shared observer.
function Station({ step, enhanced, manuallyOpen, seen, onToggle, registerNode }: StationProps) {
  const t = useTranslations("Process");
  const panelId = useId();
  const Icon = ICONS[step.icon];
  const title = t(`steps.${step.key}.title`);
  const short = t(`steps.${step.key}.short`);
  const checklist = step.hasChecklist
    ? (t.raw(`steps.${step.key}.checklist` as ChecklistCopyKey) as string[])
    : null;
  const kindLabel = step.kind === "milestone" ? t("timeline.milestoneLabel") : t("timeline.phaseLabel");
  const isOpen = !enhanced || manuallyOpen || seen;

  const head = (
    <>
      <span className="font-mono text-mono-xs uppercase opacity-60">
        {String(step.order).padStart(2, "0")}
      </span>
      <Marker step={step} title={title} />
    </>
  );

  const description = (
    <span className="flex items-start gap-2 pl-9 text-body-s opacity-80">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{short}</span>
    </span>
  );

  if (!checklist) {
    // Nothing to disclose — kickOff and ideation render as a plain block,
    // no button and no chevron, so they never read as a broken control now
    // that every other station opens on its own (board feedback, 2026-08-19).
    return (
      <div className="relative flex flex-col items-start gap-2">
        {head}
        {description}
      </div>
    );
  }

  return (
    <div
      ref={(node) => registerNode(step.key, node)}
      data-open={isOpen ? "" : undefined}
      data-station-key={step.key}
      className="relative flex flex-col items-start gap-2"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => onToggle(step.key)}
        className="flex w-full items-center gap-2 rounded-md p-2 text-left transition-[background-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:bg-ink/5 focus-visible:-translate-y-px focus-visible:bg-ink/5"
      >
        <span className="sr-only">{`${kindLabel}: ${title}`}</span>
        <span aria-hidden="true" className="flex flex-1 items-center gap-2">
          {head}
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
// A station with a checklist takes real layout space once open — a click
// or the scroll-latch below expands the checklist in normal flow, pushing
// later stations down, rather than floating it over them. The previous
// "never moves a neighbor" floating-panel technique assumed at most one
// station was ever open at a time (a strict accordion); this component no
// longer enforces that — stations accumulate open as the reader scrolls
// down and stay open — so several panels can be open at once, and a
// floating panel from an earlier station would then overlap a later one's
// own content instead of just sitting quietly below it.
export function ProcessTimeline() {
  const t = useTranslations("Process");
  const prefersReducedMotion = usePrefersReducedMotion();
  const hasMounted = useHasMounted();
  const [manuallyOpenKeys, setManuallyOpenKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [seenKeys, setSeenKeys] = useState<ReadonlySet<string>>(() => new Set());
  const nodesRef = useRef<Map<string, HTMLDivElement>>(new Map());

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

  const registerNode = useCallback((key: string, node: HTMLDivElement | null) => {
    if (node) {
      nodesRef.current.set(key, node);
    } else {
      nodesRef.current.delete(key);
    }
  }, []);

  // Enhanced (closed-by-default, scroll-revealed) only once the client has
  // mounted and confirmed motion is allowed — every other case, including
  // the render before that's confirmed, falls back to permanently open,
  // which is exactly what a no-JS reader's server-rendered markup already
  // looks like, since that fallback needs no script to take effect.
  const enhanced = hasMounted && !prefersReducedMotion;

  // One shared observer for every station with a checklist, not one per
  // station — every ref is already attached by the time this effect runs
  // (refs commit before effects), and the station list never changes, so
  // there's nothing to re-observe later. A station is dropped from
  // observation the moment it's first seen — `seenKeys` never clears it
  // again, so watching it further would only cost cycles for no purpose.
  useEffect(() => {
    if (!enhanced) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const newlySeen = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => (entry.target as HTMLElement).dataset.stationKey)
          .filter((key): key is string => Boolean(key));
        if (newlySeen.length === 0) return;
        setSeenKeys((current) => {
          const next = new Set(current);
          let changed = false;
          for (const key of newlySeen) {
            if (!next.has(key)) {
              next.add(key);
              changed = true;
            }
          }
          return changed ? next : current;
        });
        for (const entry of entries) {
          if (entry.isIntersecting) observer.unobserve(entry.target);
        }
      },
      // A station latches open once 40% of its own height has scrolled
      // into the viewport — generous enough that a "scroll into view" that
      // stops at the nearest edge (a station never re-centers itself)
      // still crosses it, rather than a rootMargin band a station could
      // land outside of entirely depending on where it stops.
      { threshold: 0.4 },
    );
    for (const node of nodesRef.current.values()) observer.observe(node);
    return () => observer.disconnect();
  }, [enhanced]);

  return (
    <Section className="relative isolate">
      <Container>
        <div
          role="group"
          aria-label={t("timeline.regionLabel")}
          className="relative isolate flex flex-col gap-10 py-20 md:py-24"
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
              seen={seenKeys.has(step.key)}
              onToggle={toggle}
              registerNode={registerNode}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}

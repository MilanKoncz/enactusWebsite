"use client";

import { useId, useState } from "react";
import {
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
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { CHECKLIST_LENGTH, steps, type IconKey, type Step } from "@/content/process";

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

// 9 tracks, not 8: each field spans 2 columns starting at its own 1-based
// index (kickOff at 1, ideation at 2, innoGating at 3, …, startup at 8/span
// 2 = columns 8-9). That off-by-one stagger is deliberate, not a bug — a
// milestone and the phase right after it share one shared column, so the
// row-1/row-3 split (below) reads as one interlocking sequence instead of
// two independent rows that happen to be the same width.
const TRACK_COLUMNS = 9;

// Never `width`/`height`/`top`/`left` (docs/design-system.md's Interaction
// section) — the checklist panel is `position: absolute` specifically so
// opening it can never be a layout-affecting height change: it floats
// outside its field's own box on transform + opacity alone, every field
// keeps the exact height it always had, whether its panel is open or not.
// That also means the panel is never the reason a mobile station's checklist
// stays out of the accessibility tree — it's always rendered, just visually
// faded and non-interactive until opened (same contract as HoverDetail.tsx).
// Full field width below md (where the field itself is already the full
// column width), but a fixed, wider card at md+ — each field is only 2 of 9
// grid tracks there, too narrow to hold three checklist lines without
// cramped wrapping. The horizontal anchor (center vs. an edge) is decided
// per station by panelHorizontalPosition below, not fixed here, since a
// panel centered on the track's own first or last field spills past the
// viewport. translate-x is a permanent positioning transform, not part of
// the open/close animation; Tailwind's translate utilities compose
// independent x/y custom properties, so it coexists with the translate-y
// toggle in PANEL_DIRECTION/PANEL_OPEN below without either one overwriting
// the other.
const PANEL_BASE =
  "absolute inset-x-0 z-10 flex flex-col gap-2 rounded-md border border-ink/10 bg-paper p-4 opacity-0 pointer-events-none transition-[opacity,transform] duration-[var(--duration-calm)] ease-signature md:inset-x-auto md:w-64";

// The first two and last two stations sit close enough to the track's own
// edges that a panel centered on their narrow (2-of-9-column) field spills
// past the viewport — confirmed by tests/e2e/prozess.spec.ts's
// no-horizontal-scroll check at 768px, where a centered panel on the first
// station reached x < 0. Anchoring those four to the field's near edge
// instead keeps every panel fully on-screen without shrinking it.
function panelHorizontalPosition(index: number, total: number): string {
  if (index <= 1) return "md:left-0 md:translate-x-0";
  if (index >= total - 2) return "md:left-auto md:right-0 md:translate-x-0";
  return "md:left-1/2 md:-translate-x-1/2";
}

// Milestone panels open upward (their field sits in the row above the
// thread); phase panels open downward (theirs sits below it) — both move
// away from the thread, never across it. Below md there is no thread-relative
// row to keep clear of, so every panel opens downward instead, over
// whichever station follows it in the stack; only one station is ever open
// at once, so that overlap stays contained.
const PANEL_DIRECTION: Record<Step["kind"], string> = {
  milestone: "top-full mt-2 translate-y-1 md:top-auto md:bottom-full md:mb-2 md:mt-0 md:translate-y-1",
  phase: "top-full mt-2 translate-y-1",
};

// group-data-[open]:, not a bare group-data-open: — "open" is a custom
// attribute (Station sets data-open below), not one of Tailwind's built-in
// boolean variants, so it needs the arbitrary-value bracket syntax.
const PANEL_OPEN =
  "group-data-[open]:translate-y-0 group-data-[open]:opacity-100 group-data-[open]:pointer-events-auto desktop-hover:group-hover:translate-y-0 desktop-hover:group-hover:opacity-100 desktop-hover:group-hover:pointer-events-auto desktop-hover:group-focus-within:translate-y-0 desktop-hover:group-focus-within:opacity-100 desktop-hover:group-focus-within:pointer-events-auto";

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
  const checklist = t.raw(`steps.${step.key}.checklist`) as string[];
  const isMilestone = step.kind === "milestone";

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2",
        isMilestone ? "md:row-start-1 md:self-end md:items-start" : "md:row-start-3 md:self-start md:items-start",
      )}
      style={{ gridColumn: `${index + 1} / span 2` }}
      data-open={isOpen ? "" : undefined}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => onOpen(step.key)}
        onFocus={() => onOpen(step.key)}
        onBlur={() => onClose(step.key)}
        className="flex w-full flex-col items-start gap-2 rounded-md p-2 text-left transition-[background-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:bg-ink/5 focus-visible:-translate-y-px focus-visible:bg-ink/5"
      >
        <span className="font-mono text-mono-xs uppercase opacity-60">
          {String(step.order).padStart(2, "0")}
        </span>
        {/* GateMarker's gold rule is the only sighted cue that this station is
            a Zeitpunkt rather than a Phase (a plain mono span, right below);
            an sr-only string carries that same distinction to anyone not
            reading the rule visually. It replaces rather than prefixes the
            visible title (which is aria-hidden below) — splitting "kind: " and
            the title across sibling nodes left the exact spacing between them
            up to the accessible-name algorithm's whitespace handling, which
            doesn't insert a separator between two inline siblings. `contents`
            keeps the aria-hidden wrapper out of the flex layout, so GateMarker
            (or the plain title span for a phase) stays a direct flex item of
            the button exactly as if the wrapper weren't there. */}
        <span className="sr-only">
          {`${isMilestone ? t("timeline.milestoneLabel") : t("timeline.phaseLabel")}: ${title}`}
        </span>
        <span aria-hidden="true" className="contents">
          {isMilestone ? (
            <GateMarker label={title} variant="milestone" />
          ) : (
            <span className="whitespace-nowrap font-mono text-mono-s uppercase">{title}</span>
          )}
        </span>
        <span className="flex items-start gap-2 text-body-s opacity-80">
          <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{t(`steps.${step.key}.short`)}</span>
        </span>
      </button>
      <div
        id={panelId}
        className={cn(
          PANEL_BASE,
          PANEL_DIRECTION[step.kind],
          panelHorizontalPosition(index, steps.length),
          PANEL_OPEN,
        )}
      >
        <p className="font-mono text-mono-xs uppercase opacity-60">
          {isMilestone ? t("timeline.criteriaLabel") : t("timeline.benefitsLabel")}
        </p>
        <ul className="flex flex-col gap-1.5 text-body-s">
          {Array.from({ length: CHECKLIST_LENGTH }, (_, i) => checklist[i]).map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-ink/40" />
              <PlaceholderMark
                variant={isMilestone ? "missing" : "unverified"}
                hint={isMilestone ? t("timeline.criteriaHint") : t("timeline.draftHint")}
              >
                {item}
              </PlaceholderMark>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// The golden thread used to run through this timeline as its spine; it is
// homepage-only since 2026-08-16 (see threadRoute.ts), so the stations carry
// the band on their own. Desktop *reveals* a station on hover via pure CSS
// (desktop-hover: variants, inert on touch, where hover: none) — but
// `aria-expanded` has to describe the same thing sighted mouse users see, so
// keyboard focus (which hover-capable and touch devices alike can reach)
// drives `openKey` too: focusing a station opens it, blurring it closes it,
// same as a mouse leaving a hover target would. A tap does both — focus then
// click — so touch gets the identical open-on-focus behavior for free. At
// most one checklist is open at a time because focusing the next station
// blurs the previous one first.
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
          // The middle row stays a fixed 4rem after the thread's removal: it
          // is the breathing space between the station icons above it and
          // their labels below, and an auto track with nothing in it would
          // collapse the band to zero.
          className="relative isolate flex flex-col gap-10 py-20 md:grid md:grid-rows-[auto_4rem_auto] md:gap-x-0 md:gap-y-8 md:py-24"
          style={{ gridTemplateColumns: `repeat(${TRACK_COLUMNS}, minmax(0, 1fr))` }}
        >
          {steps.map((step, index) => (
            <Station key={step.key} step={step} index={index} openKey={openKey} onOpen={open} onClose={close} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

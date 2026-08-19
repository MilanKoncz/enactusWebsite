"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { kpis, type KpiKey } from "@/content/kpis";

type KpiFormat = "count" | "atLeastCount" | "atLeastCurrency" | "topRank" | "unitCount";

const COUNT_DURATION_MS = 1200;

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

// No IntersectionObserver-in-a-hook here — a single observer, owned by
// HomeKpis itself, watches the whole row so all five figures start counting
// on the same frame (docs/design-system.md: "one orchestrated moment beats
// ten scattered effects"). `seen` only ever flips false→true: once this
// section has been scrolled past, scrolling back up must not restart it.
// Undefined IntersectionObserver (no browser support) degrades to "never
// seen" — the figures stay at their server-rendered final value forever,
// the same safe fallback a reduced-motion reader gets deliberately.
function useSeenOnce<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (seen || typeof IntersectionObserver === "undefined") return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);

  return [ref, seen];
}

// Starts at `target` — the exact string the server rendered, and what a
// no-JS or reduced-motion reader keeps forever — so there is never a
// hydration mismatch and never a moment with no number at all. Counting
// only ever begins once `start` flips true (HomeKpis's shared
// IntersectionObserver): a plain requestAnimationFrame loop, timed against
// a value read once when the loop starts, not a recurring external clock —
// the useNow.ts bug this project already hit came from a clock read inside
// useSyncExternalStore's getSnapshot, which this isn't.
function AnimatedFigure({
  target,
  start,
  reducedMotion,
  format,
}: {
  target: number;
  start: boolean;
  reducedMotion: boolean;
  format: (value: number) => string;
}) {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (!start || reducedMotion) return;
    let frame: number;
    const startTime = performance.now();
    // No separate setDisplay(0) here — the first requestAnimationFrame
    // callback below computes progress ≈ 0 on its own and sets the same
    // value through the one code path every later frame also uses, rather
    // than a synchronous setState call directly in the effect body
    // (react-hooks/set-state-in-effect).
    function tick(now: number) {
      const progress = Math.min((now - startTime) / COUNT_DURATION_MS, 1);
      if (progress < 1) {
        setDisplay(Math.round(target * easeOutCubic(progress)));
        frame = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, reducedMotion, target]);

  return <span className="tabular-nums">{format(display)}</span>;
}

// funding and projectIterations are lower bounds ("mehr als"), rendered with
// a leading ">"; worldRanking is a rank, rendered with a leading "Top"; the
// spin-off count carries its own unit word ("5 Projekte") since "5" alone,
// beside a label reading "Gegründet/Übergeben", read as an orphaned digit —
// see content/kpis.ts.
const KPI_FORMAT: Record<KpiKey, KpiFormat> = {
  projectIterations: "atLeastCount",
  funding: "atLeastCurrency",
  nationalChampionships: "count",
  worldRanking: "topRank",
  spinoffs: "unitCount",
};

// Five figures that count up from zero the first time this row scrolls into
// view (useSeenOnce above), once, never again — board feedback, 2026-08-19,
// on top of the otherwise-unanimated homepage (docs/design-system.md: "one
// orchestrated moment beats ten scattered effects" still governs everywhere
// else). Board-confirmed as of 2026-08-15/2026-08-16; the `unverified`
// PlaceholderMark path stays in place (rather than being deleted) for the
// next figure that ships ahead of board sign-off.
//
// Board feedback dropped both the "Kennzahlen" eyebrow/"Zahlen, die für
// sich sprechen" headline pairing and the per-row "Stand: {date}" line —
// this is now a quiet strip (a small eyebrow, nothing louder) rather than
// its own fully-headlined section, so there's no SectionHeading here.
export function HomeKpis() {
  const t = useTranslations("Kpis");
  const tPlaceholder = useTranslations("Placeholder");
  const format = useFormatter();
  const reducedMotion = usePrefersReducedMotion();
  const [rowRef, seen] = useSeenOnce<HTMLDivElement>();

  function formatValue(key: KpiKey, value: number): string {
    switch (KPI_FORMAT[key]) {
      case "atLeastCurrency":
        return `>${format.number(value, { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}`;
      case "atLeastCount":
        return `>${format.number(value)}`;
      case "topRank":
        return t("topRankFormat", { value: format.number(value) });
      case "unitCount":
        return t("spinoffsFormat", { value: format.number(value) });
      default:
        return format.number(value);
    }
  }

  return (
    <Section className="relative isolate">
      <ThreadSegment stop="kpis" />
      <Container className="relative flex flex-col gap-10">
        <Eyebrow className="text-center lg:text-left">{t("eyebrow")}</Eyebrow>
        {/* Two columns from 360px up — five figures never fit one legible
            column, so the choice is 1 vs 2, not 1 vs 5. lg:grid-rows-[auto_
            auto_auto] plus each tile's lg:grid-rows-subgrid below is what
            keeps every tile's number/label/detail on the same three
            baselines, whether or not that tile's detail line is empty — a
            fixed min-height alone can't do that once a label wraps to two
            lines. Below lg there's only ever one tile per row, so equal
            height there falls out of the grid for free. */}
        <div
          ref={rowRef}
          className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-5 lg:grid-rows-[auto_auto_auto] lg:gap-x-0 lg:gap-y-0"
        >
          {kpis.map((kpi, index) => {
            const isLast = index === kpis.length - 1;
            return (
              <div
                key={kpi.key}
                className={cn(
                  "flex flex-col gap-2 text-center lg:grid lg:grid-rows-subgrid lg:row-span-3 lg:gap-2 lg:border-l lg:border-gold lg:px-6 lg:text-left lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0",
                  isLast && "col-span-2 lg:col-span-1",
                )}
              >
                {/* display-2 (4rem) only fits the tablet range: two roomy
                    columns. Both ends of the breakpoint scale give this row
                    a narrow column instead — two tight columns below sm, five
                    columns from lg — and display-2's widest figure
                    (">150.000 €") runs past either one and collides with its
                    neighbour, confirmed by measuring the rendered width, not
                    eyeballed. Below sm that figure needs display-4 (2rem),
                    not display-3 (2.5rem) — measured at 154px against a
                    152px column, right at the edge — after the Lilita One
                    swap (2026-08-19): its glyphs run noticeably wider per
                    character than Instrument Serif's did, and the currency
                    formatter's non-breaking space between the amount and
                    "€" means the browser has nowhere to wrap this string, so
                    an even slightly-too-wide size overflows the column
                    outright rather than breaking to a second line. The
                    spin-off tile's "5 Projekte" is wider than every other
                    tile's figure at exactly the width the five-column row
                    gets tightest (lg, before lg:text-display-3 would apply)
                    — display-4 also clears the column there; sm keeps the
                    same size as the rest of the row. display-4, not
                    heading-1: same 2rem size, but weight 400 like every other
                    figure in this row — heading-1's weight 600 read as a
                    different typeface next to the other four (getComputedStyle
                    confirmed: 600 vs 400, both nominally the display font —
                    Instrument Serif at the time this was found, Lilita One
                    since 2026-08-19 — neither ships a 600 cut, so either one
                    synthesized a fake bold here). */}
                <p
                  className={cn(
                    "text-display-4 font-display sm:text-display-2 lg:text-display-3",
                    isLast && "lg:text-display-4",
                  )}
                >
                  {kpi.verified ? (
                    <AnimatedFigure
                      target={kpi.value}
                      start={seen}
                      reducedMotion={reducedMotion}
                      format={(value) => formatValue(kpi.key, value)}
                    />
                  ) : (
                    <PlaceholderMark variant="unverified" hint={tPlaceholder("unverifiedHint")}>
                      <AnimatedFigure
                        target={kpi.value}
                        start={seen}
                        reducedMotion={reducedMotion}
                        format={(value) => formatValue(kpi.key, value)}
                      />
                    </PlaceholderMark>
                  )}
                </p>
                {/* lg:self-center: the subgrid's label row is sized to the
                    tallest label across all five tiles (several wrap to two
                    lines at this column width), so a one-line label like
                    "Weltweit" would otherwise sit flush at the top of that
                    taller row by default (grid's align-items: stretch keeps
                    the box tall, but block content still renders from its
                    top) — leaving no visible slack above it but a wide one
                    below, before the detail line starts. Centering the label
                    within its row splits that same slack evenly above and
                    below, so the gap down to the detail line reads the same
                    as the gap up from the value, measured: both 8px of
                    box-model gap plus ~9px of even leading either side.
                    Below lg every tile sizes its own rows independently (no
                    shared subgrid track), so there's no slack to correct
                    there. */}
                <Eyebrow className="lg:self-center">{t(`labels.${kpi.key}`)}</Eyebrow>
                {/* Reserved for a per-figure detail (e.g. which years the
                    championships were won) once one exists — empty rather
                    than invented, kept at one line's height so adding it
                    later doesn't reflow the grid. worldRanking is the first
                    figure to actually use it (the field size the rank was
                    measured against). Same treatment as the label above it
                    (Eyebrow: Geist Mono, uppercase, the same size and
                    tracking) rather than body copy — it reads as a footnote
                    to the label, not as a second sentence. */}
                {/* whitespace-nowrap: this line reserves exactly one line's
                    height (min-h-[1lh]) — an unforced wrap here overflows
                    that reservation and reads as a stray paragraph break in
                    the row. Below 375px "von über 1.000 Teams" (176.8px
                    unwrapped, measured) no longer fits its ~152px column;
                    letting it overflow pushed the page itself into
                    horizontal scroll (measured: 369px document against a
                    360px viewport), which the definition of done rules out.
                    An ellipsis truncation used to sit here instead, but a
                    cut-off figure ("von über 1.000 T…") is worse than a
                    shorter complete one — board feedback, 2026-08-19 — so
                    below 375px this swaps to "worldRankingDetailShort", a
                    dedicated short translation, not a shrunk font or a
                    JS-measured breakpoint. */}
                <Eyebrow className="min-h-[1lh] whitespace-nowrap">
                  {kpi.key === "worldRanking" ? (
                    <>
                      <span className="min-[375px]:hidden">{t("worldRankingDetailShort")}</span>
                      <span className="hidden min-[375px]:inline">{t("worldRankingDetail")}</span>
                    </>
                  ) : null}
                </Eyebrow>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

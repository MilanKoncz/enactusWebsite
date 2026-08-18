import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { kpis, type KpiKey } from "@/content/kpis";

type KpiFormat = "count" | "atLeastCount" | "atLeastCurrency" | "topRank" | "unitCount";

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

// Five static figures, deliberately not animated (docs/design-system.md:
// "one orchestrated moment beats ten scattered effects" — that moment is
// the hero, not this). Board-confirmed as of 2026-08-15/2026-08-16; the
// `unverified` PlaceholderMark path stays in place (rather than being
// deleted) for the next figure that ships ahead of board sign-off.
//
// Board feedback dropped both the "Kennzahlen" eyebrow/"Zahlen, die für
// sich sprechen" headline pairing and the per-row "Stand: {date}" line —
// this is now a quiet strip (a small eyebrow, nothing louder) rather than
// its own fully-headlined section, so there's no SectionHeading here.
export function HomeKpis() {
  const t = useTranslations("Kpis");
  const tPlaceholder = useTranslations("Placeholder");
  const format = useFormatter();

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
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-5 lg:grid-rows-[auto_auto_auto] lg:gap-x-0 lg:gap-y-0">
          {kpis.map((kpi, index) => {
            const formatted = formatValue(kpi.key, kpi.value);
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
                    eyeballed. display-3 (2.5rem) is the size that clears both
                    narrow cases. The spin-off tile's "5 Projekte" is wider
                    than every other tile's figure at exactly the width the
                    five-column row gets tightest (lg, before lg:text-display-3
                    would apply) — heading-1 (2rem) is the one step down that
                    still clears the column there; every other breakpoint
                    keeps the same size as the rest of the row. */}
                <p
                  className={cn(
                    "text-display-3 font-display sm:text-display-2 lg:text-display-3",
                    isLast && "lg:text-heading-1",
                  )}
                >
                  {kpi.verified ? (
                    formatted
                  ) : (
                    <PlaceholderMark variant="unverified" hint={tPlaceholder("unverifiedHint")}>
                      {formatted}
                    </PlaceholderMark>
                  )}
                </p>
                <Eyebrow>{t(`labels.${kpi.key}`)}</Eyebrow>
                {/* Reserved for a per-figure detail (e.g. which years the
                    championships were won) once one exists — empty rather
                    than invented, kept at one line's height so adding it
                    later doesn't reflow the grid. worldRanking is the first
                    figure to actually use it (the field size the rank was
                    measured against). Same treatment as the label above it
                    (Eyebrow: Geist Mono, uppercase, the same size and
                    tracking) rather than body copy — it reads as a footnote
                    to the label, not as a second sentence. */}
                <Eyebrow className="min-h-[1lh]">
                  {kpi.key === "worldRanking" ? t("worldRankingDetail") : null}
                </Eyebrow>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

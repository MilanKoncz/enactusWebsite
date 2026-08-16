import { useFormatter, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { kpis, type KpiKey } from "@/content/kpis";

type KpiFormat = "count" | "atLeastCount" | "atLeastCurrency" | "topRank";

// funding and projectIterations are lower bounds ("mehr als"), rendered with
// a leading ">"; worldRanking is a rank, rendered with a leading "Top" —
// see content/kpis.ts.
const KPI_FORMAT: Record<KpiKey, KpiFormat> = {
  projectIterations: "atLeastCount",
  funding: "atLeastCurrency",
  nationalChampionships: "count",
  worldRanking: "topRank",
  spinoffs: "count",
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
      default:
        return format.number(value);
    }
  }

  return (
    <Section className="relative isolate">
      <ThreadSegment stop="kpis" />
      <Container className="relative flex flex-col gap-10">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {kpis.map((kpi) => {
            const formatted = formatValue(kpi.key, kpi.value);
            return (
              <div key={kpi.key} className="flex flex-col gap-2">
                <p className="text-display-2 font-display">
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
                    measured against). */}
                <p className="min-h-[1lh] text-body-s opacity-60">
                  {kpi.key === "worldRanking" ? t("worldRankingDetail") : null}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

import { useFormatter, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ThreadSegment } from "@/components/motion/ThreadSegment";
import { kpis, type KpiKey } from "@/content/kpis";

type KpiFormat = "count" | "currency" | "atLeastCount" | "atLeastCurrency" | "multiplier";

// funding and projectIterations are lower bounds ("mehr als"), rendered with
// a leading ">"; worldCupFinals is a multiplier, rendered with a trailing
// "×" — see content/kpis.ts.
const KPI_FORMAT: Record<KpiKey, KpiFormat> = {
  nationalChampionships: "count",
  worldCupFinals: "multiplier",
  spinoffs: "count",
  funding: "atLeastCurrency",
  projectIterations: "atLeastCount",
};

// Five static figures, deliberately not animated (docs/design-system.md:
// "one orchestrated moment beats ten scattered effects" — that moment is
// the hero, not this). Board-confirmed as of 2026-08-15; the `unverified`
// PlaceholderMark path stays in place (rather than being deleted) for the
// next figure that ships ahead of board sign-off.
export function HomeKpis() {
  const t = useTranslations("Kpis");
  const tPlaceholder = useTranslations("Placeholder");
  const format = useFormatter();

  function formatValue(key: KpiKey, value: number): string {
    switch (KPI_FORMAT[key]) {
      case "currency":
        return format.number(value, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
      case "atLeastCurrency":
        return `>${format.number(value, { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}`;
      case "atLeastCount":
        return `>${format.number(value)}`;
      case "multiplier":
        return `${format.number(value)}×`;
      default:
        return format.number(value);
    }
  }

  const latestAsOf = kpis.reduce((latest, kpi) => (kpi.asOf > latest ? kpi.asOf : latest), kpis[0].asOf);
  const formattedAsOf = format.dateTime(new Date(latestAsOf), { year: "numeric", month: "long" });

  return (
    <Section className="relative isolate">
      <ThreadSegment stop="kpis" />
      <Container className="relative flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
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
                    later doesn't reflow the grid. */}
                <p className="min-h-[1lh] text-body-s opacity-60" />
              </div>
            );
          })}
        </div>
        <p className="text-body-s opacity-60">{t("asOf", { date: formattedAsOf })}</p>
      </Container>
    </Section>
  );
}

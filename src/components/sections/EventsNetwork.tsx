"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImageWithPlaceholder } from "@/components/ui/ImageWithPlaceholder";
import { LinkCard } from "@/components/ui/LinkCard";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedFigure, useSeenOnce } from "@/components/motion/AnimatedFigure";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { networkStats, teamLinks } from "@/content/network";
import { egEvents } from "@/content/egEvents";
import { GermanyMap } from "@/components/sections/GermanyMap";

// egEvent.key is a validated string, not a literal union — same cast
// pattern as ProjectDetailContent.tsx's ProjectCopyKey.
type EgEventCopyKey = Parameters<ReturnType<typeof useTranslations<"EgEvents">>>[0];

// Both network figures are approximations by the source's own wording (see
// content/network.ts) — "rund"/"über" are part of the fact, not decoration,
// so they're prefixed on every render rather than left for a reader to
// infer from a bare number. countriesGlobal has no such qualifier in the
// source, so it renders as a plain count.
export function EventsNetwork() {
  const t = useTranslations("EventsNetwork");
  const tEgEvents = useTranslations("EgEvents");
  const tPlaceholder = useTranslations("Placeholder");
  const format = useFormatter();
  const reducedMotion = usePrefersReducedMotion();
  const [statsRef, statsSeen] = useSeenOnce<HTMLDivElement>();

  return (
    <Section className="relative isolate">
      <Container className="relative flex flex-col gap-16">
        <div className="flex flex-col gap-10">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />

          {/* The four Enactus Germany events (2026-08-18): same tall,
              photo-led card shape as EventFormats.tsx, for one consistent
              card language across /events rather than a second pattern. */}
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {egEvents.map((event) => (
              <li
                key={event.key}
                className="flex h-full flex-col overflow-hidden rounded-md border border-ink/10 bg-paper"
              >
                <div className="relative aspect-3/4 overflow-hidden">
                  <ImageWithPlaceholder
                    src={event.image}
                    alt={tEgEvents(`${event.key}.imageAlt` as EgEventCopyKey)}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <Eyebrow>{tEgEvents(`${event.key}.abbreviation` as EgEventCopyKey)}</Eyebrow>
                  <h3 className="text-body-l font-medium">
                    {tEgEvents(`${event.key}.title` as EgEventCopyKey)}
                  </h3>
                  <p className="text-body-m opacity-80">
                    {tEgEvents(`${event.key}.description` as EgEventCopyKey)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Counts up once scrolled into view, same shared mechanism as
              HomeKpis' five KPI tiles (components/motion/AnimatedFigure.tsx)
              — not a second implementation. Server-rendered and the no-JS/
              reduced-motion fallback both stay the plain final value. */}
          <div ref={statsRef} className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <p className="text-display-2 font-display">
                <AnimatedFigure
                  target={networkStats.studentsGermany}
                  start={statsSeen}
                  reducedMotion={reducedMotion}
                  format={(value) => t("approx", { value: format.number(value) })}
                />
              </p>
              <Eyebrow>{t("studentsGermanyLabel")}</Eyebrow>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-display-2 font-display">
                <AnimatedFigure
                  target={networkStats.universitiesGermany}
                  start={statsSeen}
                  reducedMotion={reducedMotion}
                  format={(value) => t("atLeast", { value: format.number(value) })}
                />
              </p>
              <Eyebrow>{t("universitiesGermanyLabel")}</Eyebrow>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-display-2 font-display">
                <AnimatedFigure
                  target={networkStats.countriesGlobal}
                  start={statsSeen}
                  reducedMotion={reducedMotion}
                  format={(value) => format.number(value)}
                />
              </p>
              <Eyebrow>{t("countriesGlobalLabel")}</Eyebrow>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Eyebrow>{t("teamsHeading")}</Eyebrow>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {teamLinks.map((team) => (
              <li key={team.key}>
                {team.url ? (
                  <LinkCard
                    href={team.url}
                    title={team.name}
                    ariaLabel={t("teamLinkLabel", { name: team.name })}
                  />
                ) : (
                  <PlaceholderMark hint={tPlaceholder("missingHint")} className="w-fit text-body-m font-medium">
                    {team.name}
                  </PlaceholderMark>
                )}
              </li>
            ))}
          </ul>

          {/* Below the text links, as a supplement — not a replacement, so
              pointer-free navigation never loses the sibling teams. */}
          <GermanyMap />
        </div>
      </Container>
    </Section>
  );
}

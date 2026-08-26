import type { ReactNode } from "react";
import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { IdeathonCountdown } from "@/components/sections/IdeathonCountdown";
import { AnimatedFigure, useSeenOnce } from "@/components/motion/AnimatedFigure";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { formatEventDate } from "@/lib/calendarFormat";
import { SDG_GOAL_COUNT, SDG_GOALS_URL, sdgIconSrc } from "@/content/sdg";
import { stats } from "@/content/ideathon";
import type { CalendarEvent } from "@/content/calendar";

const SDG_GOAL_NUMBERS = Array.from({ length: SDG_GOAL_COUNT }, (_, i) => i + 1);

/**
 * The page's one h1, on ink rather than the plain-paper SectionHeading
 * intro every other subpage opens with (EventsIntro.tsx and siblings) — a
 * deliberate, contained exception: this is the site's one conversion-first
 * landing page, ported from the board's own idea.html draft, and the gold
 * word emphasis it asks for (docs/design-system.md: "gold is never a text
 * colour on paper") only works on an ink surface to begin with. No video, no
 * HeaderOverlay — those stay HomeHero.tsx's own thing; this is a plain
 * in-flow ink Section like ClosingCta.tsx/ProcessCta.tsx already use
 * elsewhere on the site, just as the page's first section instead of its
 * last.
 */
export function IdeathonHero({
  nextEvent,
  currentEvent,
}: {
  nextEvent: CalendarEvent | null;
  currentEvent: CalendarEvent | null;
}) {
  const t = useTranslations("IdeathonPage.hero");
  const locale = useLocale();
  const format = useFormatter();
  // Once the Ideathon has started, findNextIdeathonEvent stops returning it
  // (it must, for the signup gate) — but the dates are still real and worth
  // showing for the days the event is actually running.
  const displayEvent = currentEvent ?? nextEvent;

  return (
    <Section surface="ink" className="relative isolate overflow-hidden corner-glow">
      <Container className="relative flex flex-col items-center gap-10 pb-10 text-center md:pb-16">
        <div className="flex flex-col items-center gap-6">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="max-w-3xl text-display-2 font-display break-words">
            {t.rich("title", { em: (chunks) => <span className="text-gold">{chunks}</span> })}
          </h1>
          <p className="max-w-2xl text-body-l opacity-80">{t("lead")}</p>
          {locale === "en" && <p className="max-w-2xl text-body-s opacity-70">{t("languageNote")}</p>}
        </div>

        {/* Its own block, not a trailing muted line: the board asked this to
            read as a real theme, not an afterthought, so it gets an Eyebrow
            label plus the full set of official SDG icons (unmodified, per
            the UN's own usage guidelines — same convention as
            ProjectDetailContent.tsx). Decorative (empty alt) and not
            individually linked: unlike a project's sdgFocus, these 17 don't
            each represent a fact specific to this event, only the UN's
            three-pillar framing named in sdgNote, which carries the one real
            link (SDG_GOALS_URL) that matters here. */}
        <div className="flex w-full max-w-2xl flex-col items-center gap-3 border-t border-paper/10 pt-6">
          <Eyebrow>{t("sdgEyebrow")}</Eyebrow>
          <p className="text-body-s opacity-80">
            {t.rich("sdgNote", {
              sdgLink: (chunks) => (
                <a
                  href={SDG_GOALS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SDG_GOAL_NUMBERS.map((goal) => (
              <Image
                key={goal}
                src={sdgIconSrc(goal)}
                alt=""
                width={32}
                height={32}
                className="rounded-sm opacity-90"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-10">
          {displayEvent && (
            <>
              <Fact label={t("whenLabel")} value={formatEventDate(displayEvent, locale)} />
              {displayEvent.location && <Fact label={t("whereLabel")} value={displayEvent.location} />}
            </>
          )}
          <Fact
            label={t("prizeLabel")}
            value={format.number(stats.prizeEuros, { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href="#anmelden" className={buttonClasses("primary", "lg")}>
            {t("registerCta")}
          </a>
          <a href="#ablauf" className={buttonClasses("glass", "lg")}>
            {t("scheduleCta")}
          </a>
        </div>
      </Container>

      <IdeathonCountdown event={nextEvent} currentEvent={currentEvent} />
      <IdeathonStats />
    </Section>
  );
}

// Counts up once scrolled into view, like HomeKpis' KPI row — board
// feedback on the first pass was that these should tick the way every
// other stat band on the site does, not sit static.
function IdeathonStats() {
  const t = useTranslations("IdeathonPage.stats");
  const format = useFormatter();
  const reducedMotion = usePrefersReducedMotion();
  const [rowRef, seen] = useSeenOnce<HTMLDivElement>();

  return (
    <div className="relative border-t border-paper/10 py-10">
      <Container className="flex flex-col gap-6">
        <Eyebrow className="text-center">{t("eyebrow")}</Eyebrow>
        <div ref={rowRef} className="flex flex-wrap justify-center gap-x-10 gap-y-6 text-center">
          <Stat
            value={<AnimatedFigure target={stats.days} start={seen} reducedMotion={reducedMotion} format={(v) => format.number(v)} />}
            label={t("daysLabel")}
          />
          <Stat
            value={
              <AnimatedFigure
                target={stats.teams}
                start={seen}
                reducedMotion={reducedMotion}
                format={(v) => `~${format.number(v)}`}
              />
            }
            label={t("teamsLabel")}
          />
          <Stat
            value={<AnimatedFigure target={stats.workshops} start={seen} reducedMotion={reducedMotion} format={(v) => format.number(v)} />}
            label={t("workshopsLabel")}
          />
          <Stat
            value={
              <AnimatedFigure
                target={stats.prizeEuros}
                start={seen}
                reducedMotion={reducedMotion}
                format={(v) => format.number(v, { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
              />
            }
            label={t("prizeLabel")}
          />
        </div>
      </Container>
    </div>
  );
}

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-display-4 font-display">{value}</p>
      <Eyebrow>{label}</Eyebrow>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Eyebrow>{label}</Eyebrow>
      <p className="text-body-l font-medium">{value}</p>
    </div>
  );
}

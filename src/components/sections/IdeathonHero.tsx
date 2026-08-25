import { useLocale, useTranslations } from "next-intl";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { IdeathonCountdown } from "@/components/sections/IdeathonCountdown";
import { formatEventDate } from "@/lib/calendarFormat";
import { SDG_GOALS_URL } from "@/content/sdg";
import type { CalendarEvent } from "@/content/calendar";

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
export function IdeathonHero({ nextEvent }: { nextEvent: CalendarEvent | null }) {
  const t = useTranslations("IdeathonPage.hero");
  const locale = useLocale();

  return (
    <Section surface="ink">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="max-w-3xl text-display-2 font-display break-words">
            {t.rich("title", { em: (chunks) => <span className="text-gold">{chunks}</span> })}
          </h1>
          <p className="max-w-2xl text-body-l opacity-80">{t("lead")}</p>
          <p className="max-w-2xl text-body-s opacity-70">
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
          {locale === "en" && <p className="max-w-2xl text-body-s opacity-70">{t("languageNote")}</p>}
        </div>

        <div className="flex flex-wrap gap-10">
          {nextEvent && (
            <>
              <Fact label={t("whenLabel")} value={formatEventDate(nextEvent, locale)} />
              {nextEvent.location && <Fact label={t("whereLabel")} value={nextEvent.location} />}
            </>
          )}
          <Fact label={t("prizeLabel")} value={t("prizeValue")} />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <a href="#anmelden" className={buttonClasses("primary", "lg")}>
            {t("registerCta")}
          </a>
          <a href="#ablauf" className={buttonClasses("glass", "lg")}>
            {t("scheduleCta")}
          </a>
        </div>
      </Container>

      <IdeathonCountdown event={nextEvent} />
      <IdeathonStats />
    </Section>
  );
}

function IdeathonStats() {
  const t = useTranslations("IdeathonPage.stats");
  return (
    <div className="border-t border-paper/10 py-10">
      <Container className="flex flex-wrap justify-center gap-x-10 gap-y-6 text-center">
        <Stat value={t("daysValue")} label={t("daysLabel")} />
        <Stat value={t("teamsValue")} label={t("teamsLabel")} />
        <Stat value={t("workshopsValue")} label={t("workshopsLabel")} />
        <Stat value={t("prizeValue")} label={t("prizeLabel")} />
      </Container>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
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

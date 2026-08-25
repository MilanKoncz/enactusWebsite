import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GateMarker } from "@/components/ui/GateMarker";
import { Section } from "@/components/ui/Section";
import { addDays } from "@/lib/calendarMonth";
import { parseDateOnly } from "@/lib/calendarFormat";
import { timelineSteps } from "@/content/ideathon";
import type { CalendarEvent } from "@/content/calendar";

type TimelineCopyKey = Parameters<ReturnType<typeof useTranslations<"IdeathonPage.timeline">>>[0];

// "Donnerstag · 24. September", not a static string per stop: the same
// board draft that gave us this program will run it again next year on
// different dates, and content/ideathon.ts deliberately doesn't store a
// date — each stop is `nextEvent.startDate` plus its own order offset (see
// that file's comment), so the label always matches whatever the board has
// entered at /admin/termine.
function formatStopDay(dateStr: string, locale: string): string {
  const date = parseDateOnly(dateStr);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(date);
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(date);
  return `${weekday} · ${day}`;
}

export function IdeathonTimeline({ nextEvent }: { nextEvent: CalendarEvent | null }) {
  const t = useTranslations("IdeathonPage.timeline");
  const locale = useLocale();

  return (
    <Section id="ablauf">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="text-display-3 font-display break-words">{t("title")}</h2>
        </div>
        <ol className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-16 md:gap-y-12">
          {timelineSteps.map((step) => (
            <li key={step.key} className="flex flex-col gap-2">
              <span className="font-mono text-mono-s uppercase opacity-60">
                {nextEvent
                  ? formatStopDay(addDays(nextEvent.startDate, step.order - 1), locale)
                  : t("dayFallback", { day: step.order })}
              </span>
              <GateMarker as="h3" label={t(`${step.key}.title` as TimelineCopyKey)} />
              <p className="text-body-s opacity-80">{t(`${step.key}.description` as TimelineCopyKey)}</p>
              <span className="font-mono text-mono-xs uppercase opacity-60">
                {t(`${step.key}.tags` as TimelineCopyKey)}
              </span>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

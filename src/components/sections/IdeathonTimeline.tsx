import { useLocale, useTranslations } from "next-intl";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GateMarker } from "@/components/ui/GateMarker";
import { Section } from "@/components/ui/Section";
import { addDays } from "@/lib/calendarMonth";
import { parseDateOnly } from "@/lib/calendarFormat";
import { scheduleGuide, timelineSteps } from "@/content/ideathon";
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

// Same continuous-spine mechanism as ProcessTimeline.tsx (docs/design-system.md:
// "one motif, carried consistently") — an absolute 2px gold rule spanning
// top-0/bottom-0 of a relatively positioned group, not a second line-drawing
// technique. Unlike ProcessTimeline's stations, these four are short enough
// (a day label, a GateMarker title, one sentence, a tag line) that a
// click-to-expand disclosure would add interaction for no space it actually
// needs to save, so all four stay permanently visible — the same call
// IdeathonSteps.tsx already makes for its own four-item list.
export function IdeathonTimeline({
  nextEvent,
  currentEvent,
}: {
  nextEvent: CalendarEvent | null;
  currentEvent: CalendarEvent | null;
}) {
  const t = useTranslations("IdeathonPage.timeline");
  const locale = useLocale();
  // Same reasoning as IdeathonHero's displayEvent: nextEvent alone goes null
  // the moment the Ideathon starts, but the real per-day dates should keep
  // showing for the days it's actually running.
  const displayEvent = currentEvent ?? nextEvent;

  return (
    <Section id="ablauf">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-4 w-[2px] shrink-0 bg-gold" />
            <Eyebrow>{t("eyebrow")}</Eyebrow>
          </div>
          <h2 className="text-display-3 font-display break-words">{t("title")}</h2>
        </div>
        {/* No role="group" here, unlike ProcessTimeline.tsx's div — this is
            a real <ol>/<li> list, and role="group" would override its
            implicit "list" role, leaving the <li>s without a valid
            "listitem" parent (axe: "List item parent element has a role
            that is not role=list"). aria-label works on the default list
            role exactly the same way. */}
        <ol aria-label={t("regionLabel")} className="relative isolate flex flex-col gap-10">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gold"
          />
          {timelineSteps.map((step) => (
            <li key={step.key} className="flex flex-col gap-2 pl-9">
              <span className="font-mono text-mono-s uppercase opacity-60">
                {displayEvent
                  ? formatStopDay(addDays(displayEvent.startDate, step.order - 1), locale)
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

        {/* Same disclosure pattern as ProjectGuideDownload.tsx: a real link
            once available, a disabled Button otherwise — the PDF itself
            started as the board's own repo-root ablauf.pdf, now under
            public/downloads/ (docs/content-guide.md's static-download
            location). Plain <a>, not Button's href: that would route through
            next-intl's localised Link and prefix the static file with /en. */}
        {scheduleGuide.available && scheduleGuide.href ? (
          <div className="flex flex-col items-start gap-2">
            <a href={scheduleGuide.href} target="_blank" rel="noopener noreferrer" className={buttonClasses("secondary")}>
              {t("detailsCta")}
            </a>
            {scheduleGuide.fileSizeLabel && (
              <p className="font-mono text-mono-xs uppercase opacity-60">
                {t("detailsFileInfo", { size: scheduleGuide.fileSizeLabel })}
              </p>
            )}
          </div>
        ) : (
          <Button type="button" disabled>
            {t("detailsCta")}
          </Button>
        )}
      </Container>
    </Section>
  );
}

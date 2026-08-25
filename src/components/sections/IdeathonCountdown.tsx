"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useNow } from "@/lib/useNow";
import { ideathonCountdownFor } from "@/lib/ideathonCountdown";
import type { CalendarEvent } from "@/content/calendar";

/**
 * The page's one prominent countdown, sized well past
 * EventAgenda.tsx's inline "in {days} Tagen" text — per the brief, "deutlich
 * größer als vergleichbare Elemente sonst". `useNow` is the same clock
 * hook every other ticking element on the site uses (no second one); the
 * server always renders `now === 0` (useNow's documented pre-mount
 * snapshot), so the ticking figures only ever appear after mount, avoiding
 * a hydration mismatch on a value the server can't know. The static date
 * range is already shown in IdeathonHero's facts row, rendered server-side,
 * so nothing date-related is missing before the client takes over here —
 * only the live tick is deferred.
 */
export function IdeathonCountdown({
  event,
  currentEvent,
}: {
  event: CalendarEvent | null;
  currentEvent: CalendarEvent | null;
}) {
  const t = useTranslations("IdeathonPage.countdown");
  const now = useNow(1000);
  const mounted = now > 0;

  // The Ideathon is running right now: findNextIdeathonEvent (event's
  // source) has already stopped returning it by this point, so "no event"
  // and "no longer upcoming because it's happening today" have to be told
  // apart here, not folded into one quiet state.
  if (currentEvent) {
    return (
      <div className="border-t border-paper/10 py-10">
        <Container className="flex flex-col items-center gap-1 text-center">
          <Eyebrow>{t("liveEyebrow")}</Eyebrow>
          <p className="text-body-l font-medium">{t("liveTitle")}</p>
          <p className="text-body-s opacity-70">{t("liveBody")}</p>
        </Container>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="border-t border-paper/10 py-10">
        <Container className="flex flex-col items-center gap-1 text-center">
          <Eyebrow>{t("quietEyebrow")}</Eyebrow>
          <p className="text-body-l font-medium">{t("quietTitle")}</p>
          <p className="text-body-s opacity-70">{t("quietBody")}</p>
        </Container>
      </div>
    );
  }

  const countdown = mounted ? ideathonCountdownFor(event, now) : null;

  return (
    <div className="border-t border-paper/10 py-10">
      <Container className="flex flex-col items-center gap-4 text-center">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        {/* Fixed-height reservation before mount (or once the countdown has
            elapsed) so the tick-in never shifts anything below it. */}
        <div className="flex min-h-[3.5rem] items-center justify-center">
          {countdown?.resolution === "exact" ? (
            <div className="flex items-baseline gap-6">
              <CountdownUnit value={countdown.days} label={t("days")} />
              <CountdownUnit value={countdown.hours} label={t("hours")} />
              <CountdownUnit value={countdown.minutes} label={t("minutes")} />
              <CountdownUnit value={countdown.seconds} label={t("seconds")} />
            </div>
          ) : countdown?.resolution === "days" ? (
            <p className="font-mono text-mono-l tabular-nums text-gold">{t("daysOnly", { days: countdown.days })}</p>
          ) : null}
        </div>
      </Container>
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span className="font-mono text-mono-l tabular-nums text-gold">{String(value).padStart(2, "0")}</span>
      <span className="font-mono text-mono-xs uppercase opacity-60">{label}</span>
    </span>
  );
}

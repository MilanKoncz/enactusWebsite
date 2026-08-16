"use client";

import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ApplicationForm } from "./ApplicationForm";
import { ReminderSignupForm } from "./ReminderSignupForm";
import { useNow } from "@/lib/useNow";
import { recruitingPhaseAt } from "@/lib/recruitingStatus";
import { recruitingWindow } from "@/content/recruiting";

function remainingParts(targetMs: number, nowMs: number) {
  const totalSeconds = Math.floor(Math.max(0, targetMs - nowMs) / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-display-3 tabular-nums">{String(value).padStart(2, "0")}</span>
      <span className="font-mono text-mono-xs uppercase opacity-60">{label}</span>
    </div>
  );
}

// The one client component on this page: the open/closed gate needs "now",
// which a static build can't know in advance, and the countdown itself has
// to tick — see useNow.ts's own comment on why useSyncExternalStore, not a
// build-time date, drives this. The countdown digits are aria-hidden and
// re-render every second; the sr-only sentence next to them states the same
// fact once, in words, so a screen reader isn't asked to re-announce a
// number every tick (same non-announcing pattern as everywhere else ticking
// content appears in this codebase).
export function MitmachenApplication() {
  const t = useTranslations("MitmachenPage.application");
  const locale = useLocale();
  const now = useNow();
  const phase = recruitingPhaseAt(now);

  const opensAt = recruitingWindow.opensAt ? new Date(recruitingWindow.opensAt) : null;
  const closesAt = recruitingWindow.closesAt ? new Date(recruitingWindow.closesAt) : null;
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" });
  const remaining = opensAt ? remainingParts(opensAt.getTime(), now) : null;

  return (
    <Section id="bewerbung" className="relative isolate">
      <Container className="relative flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />

        {phase === "open" ? (
          <ApplicationForm />
        ) : (
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <h3 className="text-heading-3 font-display">
                {phase === "after" ? t("notOpen.afterHeading") : t("notOpen.beforeHeading")}
              </h3>
              <p className="text-body-m opacity-80">
                {phase === "after"
                  ? t("notOpen.afterLead")
                  : opensAt && closesAt
                    ? t("notOpen.beforeLead", {
                        opensDate: dateFormatter.format(opensAt),
                        closesDate: dateFormatter.format(closesAt),
                      })
                    : t("notOpen.afterLead")}
              </p>
              {phase === "before" && opensAt && remaining && (
                <>
                  <div aria-hidden="true" className="flex gap-6 py-2">
                    <CountdownUnit value={remaining.days} label={t("notOpen.countdown.days")} />
                    <CountdownUnit value={remaining.hours} label={t("notOpen.countdown.hours")} />
                    <CountdownUnit value={remaining.minutes} label={t("notOpen.countdown.minutes")} />
                    <CountdownUnit value={remaining.seconds} label={t("notOpen.countdown.seconds")} />
                  </div>
                  <p className="sr-only">
                    {t("notOpen.countdown.srLabel", { date: dateFormatter.format(opensAt) })}
                  </p>
                </>
              )}
            </div>
            <ReminderSignupForm />
          </div>
        )}
      </Container>
    </Section>
  );
}

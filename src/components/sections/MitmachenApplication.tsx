"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ApplicationForm } from "./ApplicationForm";
import { ReminderSignupForm } from "./ReminderSignupForm";
import { useNow } from "@/lib/useNow";
import { recruitingPhaseAt, currentOrNextRecruitingWindow } from "@/lib/recruitingStatus";
import { siteDateTimeFormatter } from "@/lib/formatSiteDateTime";
import { socialLinks } from "@/content/navigation";
import type { RecruitingWindow } from "@/content/recruiting";
import type { PublicProjectArea } from "@/lib/projectAreas";
import type { PublicDepartment } from "@/lib/departments";

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
//
// `initialRecruitingWindows` is the page's own build/ISR-time value —
// correct in production, an empty (closed) fallback in a build with no
// database (lib/recruitingWindows.ts). This component re-fetches the same
// data itself on mount (GET /api/recruiting-windows) and prefers that
// result once it arrives: unlike the prop, that request is a real HTTP
// call e2e tests can intercept with page.route(), the same seam every
// other DB-backed form on this site already has. In production the two
// values are normally identical; the re-fetch mainly guards against the
// static page being stale in the narrow window before its next ISR
// regeneration.
export function MitmachenApplication({
  recruitingWindows: initialRecruitingWindows,
  projectAreas,
  departments,
}: {
  recruitingWindows: RecruitingWindow[];
  projectAreas: PublicProjectArea[];
  departments: PublicDepartment[];
}) {
  const t = useTranslations("MitmachenPage.application");
  const locale = useLocale();
  const now = useNow();
  const [recruitingWindows, setRecruitingWindows] = useState(initialRecruitingWindows);

  useEffect(() => {
    fetch("/api/recruiting-windows")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { windows?: RecruitingWindow[] } | null) => {
        if (body?.windows) setRecruitingWindows(body.windows);
      })
      .catch(() => {
        // Left as the build-time value — a same-origin GET with no
        // external dependency failing at all would mean the site itself
        // is unreachable, at which point nothing else works either.
      });
  }, []);

  const phase = recruitingPhaseAt(now, recruitingWindows);
  const window = currentOrNextRecruitingWindow(now, recruitingWindows);

  const opensAt = window ? new Date(window.start) : null;
  const closesAt = window ? new Date(window.end) : null;
  // Pinned to Europe/Berlin (see formatSiteDateTime's own comment): this used
  // to render in the visitor's own browser zone while notOpen.timezoneNote,
  // just below, told them the opposite — a visitor outside Europe saw a
  // wrong instant *and* a claim that it was Berlin time. Also closes a
  // hydration mismatch, since this is a client component: the server-rendered
  // pass used the server's own zone (UTC on Vercel), the client pass used the
  // visitor's, and the two disagreed on the very first paint.
  const dateFormatter = siteDateTimeFormatter(locale, { dateStyle: "long", timeStyle: "short" });
  const remaining = opensAt ? remainingParts(opensAt.getTime(), now) : null;

  return (
    <Section id="bewerbung" className="relative isolate">
      <Container className="relative flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />

        {phase === "open" ? (
          <ApplicationForm projectAreas={projectAreas} departments={departments} />
        ) : (
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <h3 className="text-heading-3 font-display font-normal!">
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
              {phase === "before" && opensAt && closesAt && (
                <p className="text-body-s opacity-60">{t("notOpen.timezoneNote")}</p>
              )}
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

        <p className="text-body-s opacity-60">
          {t.rich("whatsappHint", {
            whatsappLink: (chunks) => (
              <a
                href={socialLinks.find((link) => link.key === "whatsapp")?.href ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </Container>
    </Section>
  );
}

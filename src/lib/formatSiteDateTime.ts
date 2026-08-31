import { SITE_TIMEZONE } from "@/content/timezone";

/**
 * The one place a recruiting-window instant (or any other absolute timestamp
 * meant for a human, not for arithmetic) gets turned into text. Every caller
 * gets `timeZone: SITE_TIMEZONE` baked in and cannot override it — content/
 * recruiting.ts's own comment already declared this the single source of
 * truth for display/formatting; this file is what makes that true instead
 * of aspirational.
 *
 * The bug this closes: `new Intl.DateTimeFormat(locale, {...})` with no
 * `timeZone` renders in the *runtime's* zone — the visitor's browser on the
 * client, the server's own zone (UTC on Vercel) during SSR. A visitor
 * outside Europe saw a different, wrong instant, and a server-rendered
 * client component disagreed with its own client-rendered pass on hydration.
 * `options` may still set `dateStyle`/`timeStyle`/etc.; a `timeZone` key in
 * it is deliberately overwritten last, not merged, so a stray override can't
 * silently reintroduce the bug.
 */
export function siteDateTimeFormatter(
  locale: string,
  options: Intl.DateTimeFormatOptions = {},
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: SITE_TIMEZONE });
}

export function formatSiteDateTime(
  value: Date | string,
  locale: string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return siteDateTimeFormatter(locale, options).format(date);
}

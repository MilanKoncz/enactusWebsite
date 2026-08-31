import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { SITE_TIMEZONE } from "@/content/timezone";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    // Pinned so a future `useFormatter().dateTime(...)` call can't repeat
    // the bug lib/formatSiteDateTime.ts exists to close: next-intl's
    // formatter falls back to the runtime's own zone (the visitor's browser,
    // or the server's UTC during SSR) whenever neither this nor a per-call
    // option sets one.
    timeZone: SITE_TIMEZONE,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

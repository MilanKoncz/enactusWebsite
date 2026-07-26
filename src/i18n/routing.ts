import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  // German is the default and stays unprefixed (existing rankings sit on
  // these URLs); English is the only locale that gets a path prefix.
  localePrefix: "as-needed",
  // Default true would redirect an Accept-Language: en visitor off an
  // indexed German URL to /en/... — exactly what must not happen. A
  // returning English-preferring visitor sees German once and switches
  // manually; that's the accepted trade-off.
  localeDetection: false,
  // No read path for it once detection is off — keeps the site cookieless.
  localeCookie: false,
});

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
  // Every route needs an entry here once any route does — next-intl types
  // Link/getPathname/usePathname strictly against this map's keys as soon as
  // it's non-empty, so a route left out here isn't just untranslated, it's a
  // type error at every Link callsite. /termine is the one entry that
  // actually differs per locale; everything else keeps an identical slug.
  pathnames: {
    "/": "/",
    "/prozess": "/prozess",
    "/projekte": "/projekte",
    "/projekte/archiv": "/projekte/archiv",
    "/projekte/[slug]": "/projekte/[slug]",
    "/events": "/events",
    "/termine": {
      de: "/termine",
      en: "/calendar",
    },
    "/partner": "/partner",
    "/kontakt": "/kontakt",
    "/mitmachen": "/mitmachen",
    "/jobs": "/jobs",
    "/impressum": "/impressum",
    "/datenschutz": "/datenschutz",
    "/styleguide": "/styleguide",
    "/admin": "/admin",
    "/admin/mails": "/admin/mails",
    "/admin/bewerbungsfenster": "/admin/bewerbungsfenster",
    "/admin/erinnerungen": "/admin/erinnerungen",
    "/admin/loeschanfragen": "/admin/loeschanfragen",
    "/admin/termine": "/admin/termine",
    "/admin/jobs": "/admin/jobs",
    "/admin/kontakt": "/admin/kontakt",
    "/admin/bewerbungen": "/admin/bewerbungen",
    "/admin/system": "/admin/system",
  },
});

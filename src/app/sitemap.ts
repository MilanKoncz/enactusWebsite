import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";
import { routes } from "@/content/navigation";
import { projects } from "@/content/projects";

// The route tree this generates from: content/navigation.ts's `routes`
// record (the same single source of truth Header/Footer link against) plus
// the two route shapes it doesn't cover because they're not nav items —
// /projekte/archiv and one entry per content/projects.ts slug. /styleguide
// is deliberately excluded: it's a design reference, not public content
// (see robots.ts, which also keeps it out of the crawl).
const EXTRA_PATHS = ["/projekte/archiv", ...projects.map((project) => `/projekte/${project.slug}`)];

const LOCALES = ["de", "en"] as const;
type Locale = (typeof LOCALES)[number];

// German is the default locale with no URL prefix (docs/engineering.md); "/"
// itself never gets a trailing "/en" appended to nothing.
function localizedPath(path: string, locale: Locale): string {
  if (locale === "de") return path;
  return path === "/" ? "/en" : `/en${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const paths = [...Object.values(routes), ...EXTRA_PATHS];

  return paths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${base}${localizedPath(path, locale)}`,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((altLocale) => [altLocale, `${base}${localizedPath(path, altLocale)}`]),
        ),
      },
    })),
  );
}

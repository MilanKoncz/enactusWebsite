import type { Metadata } from "next";
import { siteUrl } from "./siteUrl";
import { localizedPath } from "./localizedPath";

// Deliberately its own union, not an import of lib/db.ts's Locale — a page's
// metadata function has no business depending on the database module just
// for a type, same reasoning localizedPath.ts already applies.
type Locale = "de" | "en";

/**
 * Canonical + reciprocal hreflang alternates for one page's Metadata
 * export. Every public page spreads this into its generateMetadata return
 * value alongside its own title/description — the one place this logic
 * lives, so a route can never end up with a canonical that doesn't match
 * the locale it actually renders, or an hreflang pair missing one
 * direction. `path` is the *unlocalized* pathname (routing.ts's own key
 * shape, e.g. "/prozess", "/projekte/[slug]" resolved by the caller first) —
 * the same string localizedPath.ts and sitemap.ts already key off.
 */
export function pageAlternates(path: string, locale: Locale): Metadata["alternates"] {
  const base = siteUrl();
  const urlFor = (l: Locale) => `${base}${localizedPath(path, l)}`;
  return {
    canonical: urlFor(locale),
    languages: {
      de: urlFor("de"),
      en: urlFor("en"),
      // Search engines fall back to this when a visitor's language doesn't
      // match either alternate — German, the site's default locale
      // (routing.ts), is the right fallback rather than guessing.
      "x-default": urlFor("de"),
    },
  };
}

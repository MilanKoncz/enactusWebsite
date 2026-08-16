/**
 * German is the default locale with no URL prefix (docs/engineering.md);
 * "/" itself never gets a trailing "/en" appended to nothing. Shared by
 * sitemap.ts and the reminder routes' confirm/unsubscribe redirects — both
 * need the same de/en path mapping next-intl's own routing config encodes,
 * without pulling in the routing/middleware machinery itself.
 */
export function localizedPath(path: string, locale: "de" | "en"): string {
  if (locale === "de") return path;
  return path === "/" ? "/en" : `/en${path}`;
}

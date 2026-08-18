// The one route whose English slug isn't just the German one under /en —
// kept as its own small table rather than reading routing.ts's `pathnames`
// directly, since that map's values also cover dynamic segments
// ("/projekte/[slug]") this helper is never called with.
const LOCALIZED_SLUGS: Partial<Record<string, string>> = {
  "/termine": "/calendar",
};

/**
 * German is the default locale with no URL prefix (docs/engineering.md);
 * "/" itself never gets a trailing "/en" appended to nothing. Shared by
 * sitemap.ts and the reminder routes' confirm/unsubscribe redirects — both
 * need the same de/en path mapping next-intl's own routing config encodes,
 * without pulling in the routing/middleware machinery itself.
 */
export function localizedPath(path: string, locale: "de" | "en"): string {
  if (locale === "de") return path;
  const slug = LOCALIZED_SLUGS[path] ?? path;
  return slug === "/" ? "/en" : `/en${slug}`;
}

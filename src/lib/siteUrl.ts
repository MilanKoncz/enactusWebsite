/**
 * Absolute origin used by sitemap.ts, robots.ts, and every mail that embeds
 * a link (confirmation, unsubscribe). NEXT_PUBLIC_SITE_URL is set in Vercel
 * for Production (verified 2026-08-30 — see ASSETS-TODO.md) — the fallbacks
 * below exist for preview deployments and local development, not because
 * the production domain is still undecided.
 */
let warnedAboutLocalhostFallback = false;

export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  // Reached this once, silently, on 2026-08-30: NEXT_PUBLIC_SITE_URL was
  // missing from .env.local (it's not part of the Neon integration's
  // `vercel env pull` that generated the rest of that file), so a real
  // confirmation mail went out with a http://localhost:3000 unsubscribe
  // link. One warning per process, not per call — this runs on every mail
  // dispatch and every metadata request.
  if (!warnedAboutLocalhostFallback) {
    warnedAboutLocalhostFallback = true;
    console.warn(
      "siteUrl() is falling back to http://localhost:3000 — NEXT_PUBLIC_SITE_URL is not set. " +
        "Any link in a mail sent from this process (confirmation, unsubscribe) will be broken. " +
        "Set NEXT_PUBLIC_SITE_URL in .env.local.",
    );
  }
  return "http://localhost:3000";
}

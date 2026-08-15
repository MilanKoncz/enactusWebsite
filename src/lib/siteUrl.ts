/**
 * Absolute origin used by sitemap.ts and robots.ts. No custom production
 * domain has been confirmed yet (see ASSETS-TODO.md) — falls back to
 * Vercel's own auto-generated deployment URL, then to localhost for local
 * development, rather than guessing a domain that hasn't been decided.
 */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

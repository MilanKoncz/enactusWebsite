/**
 * The only hostnames search engines may ever index, and the only Vercel
 * environment allowed to serve them un-gated. Every other combination — a
 * Vercel preview build, the auto-generated *.vercel.app production alias,
 * local development, or even a "production" build somehow reached through a
 * different host — must not be indexed: robots.ts disallows everything for
 * it, and proxy.ts adds an `X-Robots-Tag: noindex` header on top, since a
 * disallowed-but-linked-to URL can still show up in search results without
 * that header. Kept as one pure, host-only check (no request object, no
 * Next.js server APIs) so both call sites — and this file's own tests — can
 * use it without needing a real request context.
 *
 * Reads the server-side `VERCEL_ENV`, not `NEXT_PUBLIC_VERCEL_ENV`: both call
 * sites (robots.ts, proxy.ts) run exclusively server-side, where `VERCEL_ENV`
 * is always populated by Vercel with no extra configuration. The `NEXT_PUBLIC_`
 * variant only exists in the client bundle, and getting it there requires
 * turning on the Vercel project setting "Automatically expose System
 * Environment Variables" — a setting this project deliberately doesn't rely
 * on, since nothing here needs the variable in client code.
 */
const PRODUCTION_HOSTS = new Set(["enactus-mannheim.com", "www.enactus-mannheim.com"]);

export function isProductionDeployment(host: string | null): boolean {
  return process.env.VERCEL_ENV === "production" && host !== null && PRODUCTION_HOSTS.has(host);
}

export { PRODUCTION_HOSTS };

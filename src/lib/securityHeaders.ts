/**
 * Security headers applied to every response via next.config.ts's
 * `headers()`. Not `proxy.ts`: that middleware's matcher deliberately
 * excludes `/api` (its own comment explains why — locale rewriting has no
 * business running there), so anything meant to cover API routes too has to
 * live in next.config.ts instead.
 *
 * The CSP's one deliberate looseness is `script-src 'self' 'unsafe-inline'`.
 * A strict, nonce-based CSP is the harder alternative, but Next's inline
 * bootstrap scripts would need a per-request nonce threaded through
 * `proxy.ts`, which forces every page onto dynamic rendering — directly
 * against the LCP budget in docs/engineering.md, on a site with no
 * `dangerouslySetInnerHTML`, no `innerHTML`, and no third-party script
 * beyond Vercel Analytics (REVIEW.md's own audit) to begin with. `'self'`
 * still blocks the actual risk a CSP defends against here: a future,
 * accidentally-added third-party script tag. `style-src 'unsafe-inline'` is
 * not a similar trade-off, it's a requirement — Radix UI and `motion` both
 * position and animate elements via inline `style` attributes, which no
 * nonce can ever cover (nonces apply to `<style>` elements, never to a
 * `style="..."` attribute).
 *
 * `frame-ancestors 'none'` is doing the practically important work: it
 * closes the one concrete gap the review found (REVIEW.md's finding 5) —
 * /admin/bewerbungen was embeddable in a foreign frame.
 */

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://i.ytimg.com",
  "media-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  // Belt-and-braces alongside frame-ancestors above: an older browser that
  // doesn't understand CSP2 frame-ancestors still gets clickjacking
  // protection from this.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Every browser feature this site has no use for, denied outright rather
  // than left to the browser's own default allowlist.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

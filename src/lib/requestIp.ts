import type { NextRequest } from "next/server";

/**
 * Next's App Router route handlers don't expose a `request.ip` (that was
 * an Edge-only field on older Next versions, and both API routes here run
 * in the Node runtime for @react-pdf/renderer and the Neon driver). Vercel
 * sets `x-forwarded-for` on every request it proxies; the first entry in
 * that comma-separated list is the original client, everything after it is
 * intermediate proxies. Falls back straight to a sentinel — never throws,
 * since a missing IP shouldn't be able to break rate limiting or
 * consent-proof storage.
 *
 * No `x-real-ip` fallback: verified against Vercel's own documentation
 * that the platform overwrites `x-forwarded-for` on every proxied request
 * and does not forward a client-supplied value (Enterprise trusted-proxy
 * configuration excepted, not in use on this project) — so
 * `x-forwarded-for` is never actually missing on a real deployment.
 * `x-real-ip` is a header Vercel doesn't set at all, which made it the one
 * path through this function a request could use to inject a fake IP —
 * removing it closes that without losing any real functionality.
 */
export function clientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

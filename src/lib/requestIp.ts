import type { NextRequest } from "next/server";

/**
 * Next's App Router route handlers don't expose a `request.ip` (that was
 * an Edge-only field on older Next versions, and both API routes here run
 * in the Node runtime for @react-pdf/renderer and the Neon driver). Vercel
 * sets `x-forwarded-for` on every request it proxies; the first entry in
 * that comma-separated list is the original client, everything after it is
 * intermediate proxies. Falls back to `x-real-ip`, then a sentinel — never
 * throws, since a missing IP shouldn't be able to break rate limiting or
 * consent-proof storage.
 */
export function clientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

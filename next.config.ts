import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { SECURITY_HEADERS } from "./src/lib/securityHeaders";

const nextConfig: NextConfig = {
  // Applies to every route, including /api — proxy.ts's matcher
  // deliberately excludes /api (see its own comment), so this is the one
  // place a header can cover both the public pages and the API routes.
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
  images: {
    // Stars section YouTube facade (YouTubeFacade.tsx): the poster is
    // YouTube's own static thumbnail, fetched only for stars that have a
    // confirmed pitch video — see docs/design-system.md's click-to-load
    // facade requirement.
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },
  // 301s from the old Webflow site (docs/engineering.md's SEO section —
  // "losing these throws away years of ranking"). `statusCode: 301`, not
  // `permanent: true` — Next.js's `permanent` flag issues a 308, the
  // technically-equivalent modern permanent-redirect code, but the brief
  // asks for literal 301s specifically, and `statusCode` is the documented
  // way to force an exact code instead of Next's default mapping. Unprefixed
  // sources only: the old site never had an English version, so these old
  // paths were never reachable under /en either. /projekte, /mitmachen,
  // /kontakt, and /partner already resolve at the same path on this site —
  // verified directly (see AUFGABE brief), not listed here, since a redirect
  // rule whose source equals its destination is a no-op Next.js rejects as a
  // redirect loop risk, not a real redirect.
  async redirects() {
    return [
      // The Vorstand only appears on the homepage now — see
      // content/navigation.ts's footerColumns comment.
      { source: "/team", destination: "/", statusCode: 301 },
      // /prozess's timeline now covers the Ideation phase / InnoLab as one
      // of its eight stations.
      { source: "/innolab", destination: "/prozess", statusCode: 301 },
      // No standalone FAQ route — the list lives as a section on /kontakt.
      { source: "/faq", destination: "/kontakt", statusCode: 301 },
      // Individual project pages — each maps to its own content/projects.ts
      // slug. /safesteps and /safe-steps both existed on the old site and
      // both land on the same new slug.
      { source: "/differgy", destination: "/projekte/differgy", statusCode: 301 },
      { source: "/mealyo", destination: "/projekte/mealyo", statusCode: 301 },
      { source: "/impact-with-us", destination: "/projekte/impactwithus", statusCode: 301 },
      { source: "/smilegreen", destination: "/projekte/smilegreen", statusCode: 301 },
      { source: "/safesteps", destination: "/projekte/safesteps", statusCode: 301 },
      { source: "/safe-steps", destination: "/projekte/safesteps", statusCode: 301 },
      { source: "/vela", destination: "/projekte/vela", statusCode: 301 },
    ];
  },
};

// Auto-detects ./src/i18n/request.ts — no path argument needed.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);

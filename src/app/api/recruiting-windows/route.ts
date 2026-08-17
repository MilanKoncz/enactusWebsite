import { NextResponse } from "next/server";
import { getRecruitingWindows } from "@/lib/recruitingWindows";

/**
 * Lets MitmachenApplication.tsx (the one client component on /mitmachen)
 * refresh its recruiting-window data after hydration, on top of the value
 * the page already passes down as a prop from its own build/ISR-time
 * getRecruitingWindows() call.
 *
 * Two reasons this exists rather than the prop being the only source:
 *
 * 1. Testability. Every other DB-backed feature on this site
 *    (/api/bewerbung, /api/kontakt, /api/reminder) sits behind a route
 *    Playwright's page.route() can intercept in e2e tests. The prop alone
 *    has no such seam — it's baked into the static HTML at build time,
 *    which is by design DB-independent (falls back to an empty list
 *    without one, see lib/recruitingWindows.ts) and therefore can't be
 *    made to say "a window is open" without a real, migrated database
 *    reachable at build time. Routing the value through a fetchable
 *    endpoint restores the same mocking seam every other form already has.
 * 2. Freshness. The static page can be up to an hour stale
 *    (revalidate: 3600) between a board edit and the next ISR
 *    regeneration; this route always reads the same cache but is checked
 *    on every real visit, so a returning visitor's browser tab reflects
 *    the latest revalidated state without waiting on a full page reload.
 *
 * No auth, no rate limit: this returns exactly the same public data
 * that's already embedded in the page's own HTML source.
 */
export async function GET() {
  const windows = await getRecruitingWindows();
  return NextResponse.json({ windows });
}

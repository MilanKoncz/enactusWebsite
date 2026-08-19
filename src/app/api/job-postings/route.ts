import { NextResponse } from "next/server";
import { getJobPostings } from "@/lib/jobPostings";

/**
 * Lets JobsSection.tsx (the one client component reading job postings)
 * refresh after hydration, on top of the value the /jobs page already
 * passes down as a prop from its own server-rendered call — same two
 * reasons as /api/calendar-events:
 *
 * 1. Testability. A value baked into a static page at build time has no
 *    seam Playwright's page.route() can intercept; routing it through a
 *    fetchable endpoint restores one, the same way every DB-backed form on
 *    this site already works.
 * 2. Freshness. The server-rendered page can be up to an hour stale
 *    (revalidate: 3600) between an admin edit and the next cache refresh;
 *    this route always reads the same cache but is checked on every real
 *    visit.
 *
 * No auth, no rate limit: this returns exactly the same public data that's
 * already embedded in the /jobs page's own HTML source.
 */
export async function GET() {
  const jobs = await getJobPostings();
  return NextResponse.json({ jobs });
}

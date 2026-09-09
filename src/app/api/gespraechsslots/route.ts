import { NextResponse } from "next/server";
import { getRecruitingWindowsWithInterviewGrid } from "@/lib/recruitingWindows";

/**
 * Lets ApplicationForm.tsx (via MitmachenApplication.tsx) refresh the
 * interview-availability windows after hydration — same seam as
 * /api/departments and /api/project-areas, see those routes' own comments
 * for the full reasoning (testability: this is the mockable HTTP call e2e
 * tests intercept with page.route(), where a value baked into the static
 * page at build time can't be; freshness: bridges the gap before the next
 * ISR regeneration).
 *
 * Returns the raw windows-with-grid list, not pre-resolved slots: which
 * window is "open right now" depends on a real clock, and the client
 * already owns one (useNow.ts) for the exact same phase decision it makes
 * for recruitingWindows — resolving it a second time here would just be a
 * second clock that could disagree with the first.
 *
 * No auth, no rate limit: this returns exactly the same public data
 * already embedded in the page's own HTML source.
 */
export async function GET() {
  const windows = await getRecruitingWindowsWithInterviewGrid();
  return NextResponse.json({ windows });
}

import { unstable_cache as nextCache } from "next/cache";
import { listRecruitingWindows } from "@/lib/db";
import type { RecruitingWindow } from "@/content/recruiting";

/**
 * The public-facing view of the recruiting windows the board manages at
 * /admin/bewerbungsfenster (lib/db.ts's listRecruitingWindows). Cached and
 * revalidated on a tag, not read fresh on every request: /mitmachen is the
 * site's primary conversion page and expects a load spike around each
 * cycle's opening — hitting Neon on every visitor would turn a marketing
 * page into a database load test. The static page (mitmachen/page.tsx)
 * calls this at build/revalidate time; revalidateTag(RECRUITING_WINDOWS_TAG)
 * from the admin mutation routes invalidates it immediately, so a board
 * change is live within the request that made it, not after the 1-hour
 * fallback below expires.
 *
 * Fail-soft on purpose: a database hiccup here should show the public page
 * as "no window scheduled" (the same honest closed state as a genuinely
 * empty list), not throw and break the page. It also means `next build`
 * stays green without DATABASE_URL — the underlying call fails once during
 * prerendering, this catches it, and the page prerenders with an empty
 * list rather than failing the build.
 */
export const RECRUITING_WINDOWS_TAG = "recruiting-windows";

async function loadRecruitingWindows(): Promise<RecruitingWindow[]> {
  try {
    const rows = await listRecruitingWindows();
    return rows.map((row) => ({ semester: row.semester, start: row.start, end: row.end }));
  } catch (error) {
    console.error("Failed to load recruiting windows", error);
    return [];
  }
}

export const getRecruitingWindows: () => Promise<RecruitingWindow[]> = nextCache(
  loadRecruitingWindows,
  ["recruiting-windows"],
  { tags: [RECRUITING_WINDOWS_TAG], revalidate: 3600 },
);

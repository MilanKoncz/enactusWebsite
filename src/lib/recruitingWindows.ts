import { unstable_cache as nextCache } from "next/cache";
import { listRecruitingWindows } from "@/lib/db";
import type { RecruitingWindow } from "@/content/recruiting";
import type { InterviewSlotGrid } from "@/lib/interviewSlots";

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

/**
 * Next 16's `revalidateTag` takes a cache-life profile as a second
 * argument; `{ expire: 0 }` means "don't serve this stale at all", which is
 * what an admin edit needs — the board changes a date and reloads
 * /mitmachen expecting to see it. `updateTag` would read better but is
 * Server-Action-only, and the admin mutations are route handlers.
 *
 * Exported as a constant rather than repeated at each call site so all
 * three mutations (create, edit, delete) can't drift to different
 * staleness.
 */
export const RECRUITING_WINDOWS_REVALIDATE = { expire: 0 } as const;

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

/**
 * A recruiting window plus the interview-availability grid it carries
 * (migrations/0023) — kept as its own type rather than added to
 * RecruitingWindow itself, since that base type feeds phase gating, mail
 * dispatch, and retention math across the site, none of which has any use
 * for four extra columns. Only /mitmachen's application form and
 * /api/bewerbung's own validation need this richer shape.
 */
export type RecruitingWindowWithInterviewGrid = RecruitingWindow & {
  interviewGrid: InterviewSlotGrid;
};

async function loadRecruitingWindowsWithInterviewGrid(): Promise<RecruitingWindowWithInterviewGrid[]> {
  try {
    const rows = await listRecruitingWindows();
    return rows.map((row) => ({
      semester: row.semester,
      start: row.start,
      end: row.end,
      interviewGrid: {
        days: row.interviewDays,
        startTime: row.interviewStartTime,
        endTime: row.interviewEndTime,
        slotMinutes: row.interviewSlotMinutes,
      },
    }));
  } catch (error) {
    console.error("Failed to load recruiting windows with interview grid", error);
    return [];
  }
}

// Same cache tag as getRecruitingWindows above, deliberately: every admin
// mutation that can change a window's interview grid
// (RecruitingWindowsManager.tsx) already calls
// revalidateTag(RECRUITING_WINDOWS_TAG, RECRUITING_WINDOWS_REVALIDATE) for
// the plain window fields, so this needs no separate invalidation wiring.
export const getRecruitingWindowsWithInterviewGrid: () => Promise<RecruitingWindowWithInterviewGrid[]> = nextCache(
  loadRecruitingWindowsWithInterviewGrid,
  ["recruiting-windows-interview-grid"],
  { tags: [RECRUITING_WINDOWS_TAG], revalidate: 3600 },
);

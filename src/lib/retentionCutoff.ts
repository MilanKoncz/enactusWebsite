import type { RecruitingWindow } from "@/content/recruiting";
import { retention } from "@/content/retention";
import { windowContaining } from "@/lib/recruitingStatus";

/**
 * Pure calendar cutoffs for the daily cleanup route (app/api/cron/cleanup):
 * a row is deletable once it is older than its table's stated retention
 * period — nothing else factors in.
 *
 * Applications are the one table here whose deadline isn't computed live.
 * `applicationRetainUntil` runs exactly once, at insert time (lib/db.ts's
 * insertApplication), and its result is stored on the row as
 * `retain_until` (migrations/0016) — the cleanup route just compares that
 * column to `now()` directly (lib/db.ts's deleteExpiredApplications) and
 * never calls this function again for a row that already has one.
 *
 * This anchors to whatever recruiting window was open at submission time
 * (window.end + the stated months), not to created_at — matching the
 * Datenschutzerklärung's own wording ("Monate nach Ende des jeweiligen
 * Bewerbungszeitraums"), which a rolling created_at-based period never did.
 * An earlier version of this file anchored *live*, at cleanup time, to
 * "the latest expired recruiting window" — and froze the moment nobody
 * entered a new window, since every application submitted after that point
 * had no later window to anchor to and so never became deletable. Fixing
 * the freeze without going back to a pure created_at rule (which drops the
 * Datenschutz wording) is exactly what computing this once, up front, and
 * storing it buys: there's no live window list this can lose track of,
 * because it never looks at one again after the row is written. A
 * submission that arrives with no window currently open (a late arrival
 * right after one closes, or before the board enters the next one) falls
 * back to `now`, the same "no window" fallback resolveApplicationSemester
 * uses in lib/recruitingSemester.ts.
 */
export function applicationRetainUntil(now: Date, windows: RecruitingWindow[]): Date {
  const window = windowContaining(now.getTime(), windows);
  const anchor = window ? new Date(window.end) : now;
  return addMonths(anchor, retention.applications.months);
}

export function contactMessageRetentionCutoff(now: Date): Date {
  return addMonths(now, -retention.contactMessages.months);
}

export function reminderSignupRetentionCutoff(now: Date): Date {
  return addDays(now, -retention.reminderSignupsUnconfirmed.days);
}

export function ideathonSignupRetentionCutoff(now: Date): Date {
  return addMonths(now, -retention.ideathonSignups.months);
}

export function rateLimitHitRetentionCutoff(now: Date): Date {
  return addDays(now, -retention.rateLimitHits.days);
}

// Compared against each row's own expires_at (lib/db.ts's
// deleteExpiredJobPostings), not created_at like every cutoff above —
// content/retention.ts's own comment on why.
export function jobPostingRetentionCutoff(now: Date): Date {
  return addMonths(now, -retention.jobPostings.months);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

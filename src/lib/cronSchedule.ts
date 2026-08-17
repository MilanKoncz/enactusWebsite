/**
 * When the cleanup cron is next due, and whether it has gone quiet.
 *
 * The schedule is duplicated from vercel.json's `crons` entry — that file is
 * platform configuration Vercel reads at deploy time and nothing in the app
 * can import, so the two are kept in step by the test in
 * tests/unit/lib/cronSchedule.test.ts, which parses vercel.json and asserts
 * it still matches. Same approach as the design-token drift test: the
 * duplication is unavoidable, so it's enforced rather than hoped for.
 *
 * The staleness threshold exists because this cron has already missed a
 * scheduled slot in production with nothing noticing. A daily job that
 * hasn't run in over 48 hours has missed at least two — well past anything
 * a slow trigger explains, and the point at which the retention promise in
 * the Datenschutzerklärung stops being enforced.
 */
export const CLEANUP_CRON_HOUR_UTC = 3;
export const CLEANUP_CRON_SCHEDULE = "0 3 * * *";
export const CRON_STALE_AFTER_MS = 48 * 60 * 60 * 1000;

// The next 03:00 UTC strictly after `now` — today's if it's still ahead,
// otherwise tomorrow's.
export function nextCleanupRun(now: Date): Date {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), CLEANUP_CRON_HOUR_UTC, 0, 0, 0),
  );
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

// `null` for lastRun means the job has never run at all, which is the most
// serious state, not an unknown one — it's reported as stale.
export function isCleanupStale(lastRun: Date | null, now: Date): boolean {
  if (!lastRun) return true;
  return now.getTime() - lastRun.getTime() > CRON_STALE_AFTER_MS;
}

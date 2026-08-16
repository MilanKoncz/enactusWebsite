import { retention } from "@/content/retention";

/**
 * The single date past which an application row becomes deletable, or
 * `null` while nothing yet qualifies. Deliberately not "createdAt + 6
 * months" per row: every application submitted during one recruiting cycle
 * should expire together, on the same day, rather than trickling out of
 * the database one by one over the weeks a window was open — so the clock
 * starts at a window's close, not at each individual submission.
 *
 * `windowEnds` is every known window's `end` (content/recruiting.ts) —
 * content/recruiting.ts now holds a list, not one window, so retention has
 * to pick the right anchor among several cycles rather than assuming there
 * is only one. Callers can pass every window's end unfiltered: a window
 * whose own retention period hasn't elapsed yet (including one still open
 * or in the future) is filtered out below. Among the rest, this picks the
 * *latest* end date: any earlier window's applications were created before
 * that date too, so a single `created_at <= cutoff` DELETE (lib/db.ts)
 * still correctly sweeps every expired cycle in one statement, without
 * deleting a later, not-yet-expired cycle's rows.
 *
 * An empty list means no recruiting window is scheduled at all
 * (content/recruiting.ts's own empty-array case) — there's no cycle to
 * anchor to, so this falls back to a rolling per-row cutoff instead:
 * `now - 6 months`, recomputed on every call.
 */
export function applicationRetentionCutoff(now: Date, windowEnds: Date[]): Date | null {
  const months = retention.applications.months;

  if (windowEnds.length === 0) {
    return addMonths(now, -months);
  }

  const expired = windowEnds.filter((end) => now >= addMonths(end, months));
  if (expired.length === 0) return null;

  return new Date(Math.max(...expired.map((end) => end.getTime())));
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

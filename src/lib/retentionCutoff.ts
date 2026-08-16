import { retention } from "@/content/retention";

/**
 * The single date past which an application row becomes deletable, or
 * `null` while nothing yet qualifies. Deliberately not "createdAt + 6
 * months" per row: every application submitted during one recruiting cycle
 * should expire together, on the same day, rather than trickling out of
 * the database one by one over the two weeks the window was open — so the
 * clock starts at the window's close, not at each individual submission.
 *
 * Returns the boundary to compare `created_at <=` against, not a boolean,
 * so lib/db.ts's DELETE can stay a single WHERE clause: once this returns
 * a date, every row created at or before it belongs to the closed cycle
 * and is safe to remove.
 *
 * `closesAt === null` means no recruiting window is scheduled at all
 * (content/recruiting.ts's own "unscheduled" case) — there's no cycle to
 * anchor to, so this falls back to a rolling per-row cutoff instead:
 * `now - 6 months`, recomputed on every call.
 */
export function applicationRetentionCutoff(now: Date, closesAt: Date | null): Date | null {
  const months = retention.applications.months;

  if (closesAt === null) {
    return addMonths(now, -months);
  }

  const expiresAt = addMonths(closesAt, months);
  return now >= expiresAt ? closesAt : null;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

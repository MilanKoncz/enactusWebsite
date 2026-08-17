import { retention } from "@/content/retention";

/**
 * Pure calendar cutoffs for the daily cleanup route (app/api/cron/cleanup):
 * a row is deletable once it is older than its table's stated retention
 * period, counted from that row's own created_at — nothing else factors in.
 *
 * This used to anchor application retention to the latest *expired
 * recruiting window* instead of each row's own age, so a cycle's
 * applications expired together. That reads well, but it silently stops
 * working the moment nobody enters the next window: with no later window to
 * anchor to, the cutoff freezes at the last one ever added, and every
 * application submitted after that point becomes permanently undeletable —
 * a normal state for a board with yearly turnover, not an edge case. It also
 * quietly computed something different from what the Datenschutzerklärung
 * promises ("6 Monate"), which states a rolling period, not "6 months after
 * the cycle closes". Calendar-only logic can't drift from either problem: it
 * has no window to forget, and it matches the published text exactly.
 *
 * The one thing this trades away: applications from the same recruiting
 * cycle no longer expire on the same day — a submission on day one of a
 * window and one on the last day now age out independently. That is an
 * acceptable cost for a cutoff that can't silently stop enforcing itself.
 */
export function applicationRetentionCutoff(now: Date): Date {
  return addMonths(now, -retention.applications.months);
}

export function contactMessageRetentionCutoff(now: Date): Date {
  return addMonths(now, -retention.contactMessages.months);
}

export function reminderSignupRetentionCutoff(now: Date): Date {
  return addDays(now, -retention.reminderSignupsUnconfirmed.days);
}

export function rateLimitHitRetentionCutoff(now: Date): Date {
  return addDays(now, -retention.rateLimitHits.days);
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

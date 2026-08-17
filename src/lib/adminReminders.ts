import type { ReminderSignupSummary } from "@/lib/db";

/**
 * The three states a reminder-list row can be in, as the board thinks about
 * them — which is not the same as the three columns that encode them.
 * `unsubscribed` wins over `confirmed` because someone who confirmed and
 * then left is not a subscriber, and counting them as one would overstate
 * the list.
 *
 * A pure function over rows rather than three SQL counts: it's the same
 * classification the table and the totals need, so deriving it twice (once
 * in SQL, once in the page) is how the two would eventually disagree.
 */
export type ReminderState = "confirmed" | "unconfirmed" | "unsubscribed";

export function reminderState(signup: ReminderSignupSummary): ReminderState {
  if (signup.unsubscribedAt) return "unsubscribed";
  return signup.confirmed ? "confirmed" : "unconfirmed";
}

export type ReminderTotals = Record<ReminderState, number>;

export function countReminderStates(signups: ReminderSignupSummary[]): ReminderTotals {
  const totals: ReminderTotals = { confirmed: 0, unconfirmed: 0, unsubscribed: 0 };
  for (const signup of signups) {
    totals[reminderState(signup)] += 1;
  }
  return totals;
}

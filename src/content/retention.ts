import { z } from "zod";

/**
 * How long each table in lib/db.ts keeps a row before the daily cleanup
 * route (app/api/cron/cleanup) deletes it. This is the one place both the
 * Datenschutzerklärung's retention paragraph and the cleanup route read
 * from — writing the same number in both a legal text and a SQL query
 * invites drift, so only one of them is allowed to be the source.
 *
 * Every period carries `confirmedByBoard: false`: the board hasn't signed
 * off on these numbers yet (same open item as content/privacy.ts's own
 * review flag), but a stated period awaiting confirmation is more honest —
 * and more useful to a visitor exercising their rights — than the
 * PlaceholderMark this page showed before. `unconfirmedDays` for the
 * reminder list matters even though the general rule is "no periods
 * without board sign-off" would forbid publishing it: an unconfirmed
 * double opt-in row that nobody ever confirms is not personal data anyone
 * asked to keep, so a conservative default is applied regardless of
 * confirmation, same reasoning as GDPR's storage-limitation principle
 * (Art. 5(1)(e)) already cited elsewhere on the page.
 */

const retentionPeriodSchema = z.object({
  months: z.number().int().positive().optional(),
  days: z.number().int().positive().optional(),
  confirmedByBoard: z.boolean(),
});

const retentionSchema = z.object({
  // Measured from the application window's closesAt, not from each row's
  // own created_at — an application submitted on day one and one submitted
  // on the last day belong to the same cycle and should expire together.
  // See lib/retentionCutoff.ts's applicationRetentionCutoff for the
  // fallback when no window is scheduled.
  applications: retentionPeriodSchema.extend({ months: z.number().int().positive() }),
  contactMessages: retentionPeriodSchema.extend({ months: z.number().int().positive() }),
  reminderSignupsUnconfirmed: retentionPeriodSchema.extend({ days: z.number().int().positive() }),
});
export type Retention = z.infer<typeof retentionSchema>;

export const retention: Retention = retentionSchema.parse({
  applications: { months: 6, confirmedByBoard: false },
  contactMessages: { months: 12, confirmedByBoard: false },
  // Confirmed reminder rows have no fixed period at all — they're kept
  // until the subscriber unsubscribes (Art. 6(1)(a) GDPR consent lasts
  // until withdrawn), so only the unconfirmed case needs a number here.
  reminderSignupsUnconfirmed: { days: 30, confirmedByBoard: false },
});

export { retentionSchema };

import { z } from "zod";

/**
 * How long each table in lib/db.ts keeps a row before the daily cleanup
 * route (app/api/cron/cleanup) deletes it. This is the one place both the
 * Datenschutzerklärung's retention paragraph and the cleanup route read
 * from — writing the same number in both a legal text and a SQL query
 * invites drift, so only one of them is allowed to be the source.
 *
 * Every period is a rolling window measured from each row's own created_at
 * (see lib/retentionCutoff.ts) — this matches the Datenschutzerklärung's
 * wording exactly ("6 Monate" means 6 months from submission, not from some
 * later, board-maintained event), and it can never silently stop enforcing
 * itself the way an anchor tied to a recruiting window's close date could.
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
 *
 * `rateLimitHits` is not privacy-relevant (it holds a hashed IP and a
 * counter, not personal data tied to an identity) and isn't mentioned on
 * the Datenschutz page, but it lives here anyway rather than as a second,
 * hardcoded number in the cleanup route — the same "one source" reasoning
 * that governs the other three.
 */

const retentionPeriodSchema = z.object({
  months: z.number().int().positive().optional(),
  days: z.number().int().positive().optional(),
  confirmedByBoard: z.boolean(),
});

const retentionSchema = z.object({
  applications: retentionPeriodSchema.extend({ months: z.number().int().positive() }),
  contactMessages: retentionPeriodSchema.extend({ months: z.number().int().positive() }),
  reminderSignupsUnconfirmed: retentionPeriodSchema.extend({ days: z.number().int().positive() }),
  // Anchored to each row's own expires_at, not created_at like every period
  // above — a job posting is meant to stay findable at /admin/jobs for a
  // while after it lapses (the board might still want to see who applied,
  // or re-list it), just not forever. This period came directly from the
  // board's own instruction, not a guess awaiting sign-off.
  jobPostings: retentionPeriodSchema.extend({ months: z.number().int().positive() }),
  rateLimitHits: retentionPeriodSchema.extend({ days: z.number().int().positive() }),
});
export type Retention = z.infer<typeof retentionSchema>;

export const retention: Retention = retentionSchema.parse({
  applications: { months: 6, confirmedByBoard: false },
  contactMessages: { months: 12, confirmedByBoard: false },
  // Confirmed reminder rows have no fixed period at all — they're kept
  // until the subscriber unsubscribes (Art. 6(1)(a) GDPR consent lasts
  // until withdrawn), so only the unconfirmed case needs a number here.
  reminderSignupsUnconfirmed: { days: 30, confirmedByBoard: false },
  jobPostings: { months: 12, confirmedByBoard: true },
  // Not a privacy period, a housekeeping one — always been 1 day, moved
  // here from a hardcoded value in the cleanup route.
  rateLimitHits: { days: 1, confirmedByBoard: true },
});

export { retentionSchema };

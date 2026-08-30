import { z } from "zod";

/**
 * Validation for the /mitmachen reminder-list sign-up shown while the
 * application window is closed, shared by the client
 * (react-hook-form + zodResolver, ReminderSignupForm.tsx) and the server
 * (apiSchemas.ts extends this for /api/reminder). `consent` is required:
 * the reminder email is marketing communication under German law and needs
 * an explicit opt-in, not just a submitted email address
 * (docs/engineering.md) — the double opt-in flow itself lives in
 * lib/db.ts's upsertReminderSignup and /api/reminder/bestaetigen.
 *
 * The email is trimmed and lowercased before the format check, not after:
 * reminder_signups.email carries a unique constraint on the raw column, so
 * "Max@Uni.de" and "max@uni.de" used to be two different rows to Postgres
 * even though they're the same address to everyone else. `.pipe(z.email())`
 * validates the already-normalized string — chaining `.trim()`/
 * `.toLowerCase()` directly onto `z.email()` silently does nothing, since
 * those apply to the *output* of the format check, not its input.
 */
export const reminderSignupSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  consent: z.boolean().refine((value) => value === true),
});
export type ReminderSignupValues = z.infer<typeof reminderSignupSchema>;

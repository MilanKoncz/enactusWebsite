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
 */
export const reminderSignupSchema = z.object({
  email: z.email(),
  consent: z.boolean().refine((value) => value === true),
});
export type ReminderSignupValues = z.infer<typeof reminderSignupSchema>;

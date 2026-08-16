import { z } from "zod";

/**
 * Validation for the /mitmachen reminder-list sign-up shown while the
 * application window is closed — client-side only for now (see
 * ReminderSignupForm.tsx's own comment: the double opt-in flow lands with
 * the backend in Phase 4). `consent` is required: the reminder email is
 * marketing communication under German law and needs an explicit opt-in,
 * not just a submitted email address (docs/engineering.md).
 */
export const reminderSignupSchema = z.object({
  email: z.email(),
  consent: z.boolean().refine((value) => value === true),
});
export type ReminderSignupValues = z.infer<typeof reminderSignupSchema>;

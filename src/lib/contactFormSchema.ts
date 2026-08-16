import { z } from "zod";

/**
 * Validation for the /kontakt contact form. `subject` is required — the
 * board asked for it so an incoming message can be routed and triaged
 * without opening it first; the Datenschutzerklärung's field list
 * (messages/{locale}.json's Datenschutz.contactForm entry) says so too, and
 * has to keep matching this schema.
 */
export const contactFormSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email(),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(2000),
});
export type ContactFormValues = z.infer<typeof contactFormSchema>;

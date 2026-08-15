import { z } from "zod";

/**
 * Validation for the /kontakt contact form — client-side only for now (see
 * ContactForm.tsx's own comment: the submit handler is a stub, the API
 * route lands with the backend). `subject` is optional, matching
 * docs/engineering.md's data-minimization rule elsewhere on this site: a
 * field not needed to route the message shouldn't be required to send it.
 */
export const contactFormSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email(),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(10).max(2000),
});
export type ContactFormValues = z.infer<typeof contactFormSchema>;

import { z } from "zod";
import { applicationFormSchema } from "./applicationFormSchema";
import { contactFormSchema } from "./contactFormSchema";
import { reminderSignupSchema } from "./reminderSignupSchema";

/**
 * The three client form schemas extended with `locale` — the one field a
 * client submission needs but a browser form doesn't collect itself (it's
 * read from the page's own route, not typed by the visitor). The base
 * schemas in applicationFormSchema.ts / contactFormSchema.ts /
 * reminderSignupSchema.ts stay untouched so the client resolvers and their
 * existing unit tests are unaffected — this file only adds what's specific
 * to validating a request body server-side.
 */

const localeSchema = z.enum(["de", "en"]);

// `formToken` is the one field with no equivalent in the client schema:
// it's not something react-hook-form manages, just an opaque, signed
// timing token ApplicationForm.tsx fetches on mount (GET
// /api/bewerbung/token) and attaches at submit time, so /api/bewerbung can
// verify the real elapsed fill time server-side (lib/formToken.ts) — a
// client-supplied timestamp is trivial to fake by calling the route
// directly with any value at all.
export const applicationRequestSchema = applicationFormSchema.extend({
  locale: localeSchema,
  formToken: z.string(),
});
export type ApplicationRequest = z.infer<typeof applicationRequestSchema>;

export const reminderRequestSchema = reminderSignupSchema.extend({ locale: localeSchema });
export type ReminderRequest = z.infer<typeof reminderRequestSchema>;

export const contactRequestSchema = contactFormSchema.extend({ locale: localeSchema });
export type ContactRequest = z.infer<typeof contactRequestSchema>;

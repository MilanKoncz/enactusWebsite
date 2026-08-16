import { z } from "zod";

/**
 * Validation for the /mitmachen application form — client-side only for now
 * (see ApplicationForm.tsx's own comment: the submit handler is a stub, the
 * API route and the PDF/Resend pipeline land in Phase 4). Field set matches
 * docs/engineering.md and the Datenschutzerklärung's "Bewerbungsformular"
 * section exactly — no file upload, CV information is structured fields
 * only. `priorInvolvement` and `languagesSkills` stay optional: not every
 * applicant has prior engagement or extra language skills to report, and
 * requiring them would contradict the page's own "you don't need to bring
 * everything" framing. `website` is a honeypot (must stay empty); the
 * submission-timing check lives in ApplicationForm.tsx instead, since it's
 * about wall-clock time elapsed since the form mounted, not a static field
 * rule a schema can express.
 */
export const applicationFormSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.email(),
  studyProgram: z.string().trim().min(2).max(120),
  semester: z.coerce.number().int().min(1).max(20),
  university: z.string().trim().min(2).max(120),
  priorInvolvement: z.string().trim().max(600).optional(),
  languagesSkills: z.string().trim().max(300).optional(),
  motivation: z.string().trim().min(20).max(1500),
  desiredAreas: z.array(z.string()).min(1),
  availabilityHours: z.coerce.number().int().min(1).max(80),
  heardAboutUs: z.string().trim().max(150).optional(),
  consent: z.boolean().refine((value) => value === true),
  website: z.string().trim().max(0).optional(),
});

// Two distinct shapes because of `z.coerce.number()`: react-hook-form's
// `useForm` needs the *input* shape (semester/availabilityHours as the raw
// string a number input produces) for its field-values generic, while
// `onSubmit` receives the *output* shape (coerced to number) after
// zodResolver runs. Passing one type for both would make TypeScript reject
// the resolver — see react-hook-form's own generic form
// `useForm<Input, Context, Output>`.
export type ApplicationFormInput = z.input<typeof applicationFormSchema>;
export type ApplicationFormValues = z.output<typeof applicationFormSchema>;

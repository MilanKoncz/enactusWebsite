import { z } from "zod";

/**
 * Validation for the /ideathon signup form, shared by the client
 * (react-hook-form + zodResolver, IdeathonSignupForm.tsx) and the server
 * (apiSchemas.ts extends this for /api/ideathon) — same split as
 * applicationFormSchema.ts.
 *
 * Board feedback 2026-08-26: `university` dropped (every attendee is
 * already a University of Mannheim student, so the field never carried
 * information), `studyProgram` took its place in the layout, and three
 * fields were added — `teamMembers`, `motivationExperience`, and
 * `dietaryPreference` (see migrations/0015).
 *
 * `ideaDescription` and `motivationExperience` are both capped at 1000
 * characters: either field can hold sensitive free text (an unpublished
 * business idea; personal background) sent over a public form and mail
 * pipeline, so both carry an explicit length discipline (matched by a
 * `check` constraint on the DB column) rather than being an unbounded
 * textarea. `teamMembers` is capped shorter (300) — a list of names, not a
 * paragraph — and is only meaningful once `registeringAsTeam` is true, same
 * as `teamSize`; neither is hard-required by a refine, since a "yes"
 * without the details filled in yet is still a valid, useful signup.
 *
 * `dietaryPreference` is a closed enum, not free text, on purpose: a
 * free-text field here would collect allergies and intolerances, which is
 * Art. 9 GDPR health data this form must not capture (see the
 * Datenschutzerklärung's Ideathon section and the form's own hint pointing
 * allergy/intolerance reports to email instead). It has no default — a
 * visitor must actively pick one of the six options, including "keine
 * Angabe", rather than the form silently assuming "omnivor".
 *
 * `website` is the honeypot, `consent` is acknowledgment of the privacy
 * notice (Art. 6(1)(b) — see the Datenschutzerklärung — this is a
 * participation registration, not marketing consent), not the legal basis
 * itself.
 */
export const dietaryPreferenceSchema = z.enum([
  "omnivore",
  "vegetarian",
  "vegan",
  "halal",
  "kosher",
  "noAnswer",
]);
export type DietaryPreference = z.infer<typeof dietaryPreferenceSchema>;

export const ideathonSignupFormSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.email(),
  studyProgram: z.string().trim().min(2).max(120),
  semester: z.coerce.number().int().min(1).max(20),
  hasIdea: z.boolean(),
  ideaDescription: z.string().trim().max(1000).optional(),
  motivationExperience: z.string().trim().max(1000).optional(),
  registeringAsTeam: z.boolean(),
  teamSize: z.coerce.number().int().min(1).max(50).optional(),
  teamMembers: z.string().trim().max(300).optional(),
  dietaryPreference: dietaryPreferenceSchema,
  heardAboutUs: z.string().trim().max(150).optional(),
  consent: z.boolean().refine((value) => value === true),
  website: z.string().trim().max(0).optional(),
});

// Two distinct shapes for the same z.coerce.number() reason
// applicationFormSchema.ts documents: react-hook-form's useForm needs the
// *input* shape (semester/teamSize as the raw string a number input
// produces), onSubmit receives the *output* shape after zodResolver coerces
// them.
export type IdeathonSignupFormInput = z.input<typeof ideathonSignupFormSchema>;
export type IdeathonSignupFormValues = z.output<typeof ideathonSignupFormSchema>;

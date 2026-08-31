import { z } from "zod";

/**
 * The single fact that flips /datenschutz from draft to reviewed (see the
 * page brief: "Structure it so a single sentence can be flipped from draft
 * to reviewed once the Enactus Germany data protection officer has signed
 * off"). Everything else on that page is copy in messages/{locale}.json
 * under "Datenschutz"; this file holds only the one fact a board handover
 * could actually change. `reviewedAt` is required the moment `reviewed`
 * flips true, enforced below rather than left for a component to notice at
 * render time — same contract as process.ts's projectGuideSchema.
 */

const privacyReviewStatusSchema = z
  .object({
    reviewed: z.boolean(),
    reviewedAt: z.iso.date().nullable(),
  })
  .superRefine((status, ctx) => {
    if (status.reviewed && !status.reviewedAt) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewedAt"],
        message: "reviewedAt is required once reviewed is true",
      });
    }
  });
export type PrivacyReviewStatus = z.infer<typeof privacyReviewStatusSchema>;

// Flipped back to draft on 2026-08-25: the new Ideathon signup section
// (Datenschutz.tsx, messages' "ideathonSignup" key) hasn't been reviewed by
// the Enactus Germany data protection officer yet. Still draft as of
// 2026-08-31 for a second reason: the application form's own section now
// describes a new data category (the uploaded CV, stored at Vercel Blob),
// which needs the same sign-off before either can flip back to `true`.
// Flip back to `true` with a fresh `reviewedAt` once that sign-off happens
// — see ASSETS-TODO.md.
export const privacyReviewStatus: PrivacyReviewStatus = privacyReviewStatusSchema.parse({
  reviewed: false,
  reviewedAt: null,
});

export { privacyReviewStatusSchema };

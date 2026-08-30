-- New free-text field: what an applicant hopes to take away from their
-- time at Enactus, forward-looking and deliberately distinct from
-- motivation ("why us") and the area-choice reasons ("why this area") —
-- see lib/applicationFormSchema.ts's own comment on keeping the form's
-- four free-text fields non-redundant. Nullable and optional, same as
-- prior_involvement and languages_skills: not every applicant has a
-- developed answer, and requiring one would contradict the page's own
-- framing.
alter table applications add column if not exists want_to_gain text;

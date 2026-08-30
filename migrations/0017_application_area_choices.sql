-- Replaces the flat "pick any number of areas" checkbox list with up to
-- three prioritised choices, each with its own required reason. One row per
-- chosen area, not three nullable columns on applications -- a variable
-- number of choices (1 to 3) belongs in a child table, and this keeps a
-- future fourth priority (should the board ever want one) a schema change
-- here, not a wider applications table.
--
-- application_id has on delete cascade so every existing deletion path
-- (the board's own /admin/bewerbungen delete, the retention cron, and
-- /admin/loeschanfragen's GDPR erasure) keeps working unchanged -- none of
-- them need to know this table exists to still delete an application
-- completely.
--
-- Gaplessness ("no 3rd choice without a 2nd") isn't expressible as a plain
-- check constraint without a trigger, so it's enforced in
-- applicationFormSchema.ts's superRefine instead, client and server side.
-- What the database *can* enforce on its own -- the priority range, the
-- reason length, and no duplicate priority or area per application -- it
-- does, so a bug in that application-level validation can't corrupt a row
-- no matter what.
create table if not exists application_area_choices (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications (id) on delete cascade,
  priority integer not null,
  area_label text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint application_area_choices_priority_range check (priority between 1 and 3),
  constraint application_area_choices_reason_length check (char_length(reason) <= 300),
  constraint application_area_choices_priority_unique unique (application_id, priority),
  constraint application_area_choices_area_unique unique (application_id, area_label)
);

create index if not exists application_area_choices_application_id_idx
  on application_area_choices (application_id);

-- No backfill: a priority guessed from the old array's order would be an
-- invented fact (the applicant never ranked anything), and there is no
-- reason text to recover for an application that predates this feature.
-- Existing rows keep their desired_areas array; new rows leave it null and
-- write to application_area_choices instead. Admin, CSV, and the PDF
-- render whichever one a given application actually has (lib/db.ts,
-- lib/applicationPdf.tsx) -- see ASSETS-TODO.md for when the column itself
-- can be dropped.
alter table applications alter column desired_areas drop not null;

-- "Ressorts": the cross-project positions (Team-Lead, Operations, ...) an
-- applicant can additionally volunteer for. Deliberately a second category
-- next to project_areas rather than more rows in it: the Wunschbereiche are
-- ranked 1 to 3 with a required reason each, so an applicant who spent all
-- three priorities on positions ended up in no project at all. A Ressort has
-- no priority and no reason, which is exactly why it cannot share that table.
--
-- Structure is otherwise an exact copy of project_areas (migrations/0010):
-- both labels as columns rather than keys into messages/, a sort_order the
-- board controls, and an `active` flag so a position can be retired without
-- touching the applications that already name it.
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  label_de text not null,
  label_en text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists departments_sort_order_idx on departments (sort_order);

-- On label_de only, same as project_areas_label_de_idx: label_en may
-- legitimately collide (most of these names are identical in both languages),
-- and the seed below needs a conflict target to stay idempotent.
create unique index if not exists departments_label_de_idx on departments (label_de);

-- Labels, never a foreign key -- the same rule applications.desired_areas and
-- application_area_choices.area_label already follow: renaming a row above
-- must not silently rewrite what an applicant actually chose months ago.
--
-- Nullable with no default and no backfill, on purpose. NULL means "this
-- application predates the field", an empty array means "asked, nothing
-- selected". Both display as nothing; keeping them distinct in the column
-- costs nothing and avoids claiming an old applicant declined to pick.
--
-- No check constraint on the number of entries: the cap is MAX_DEPARTMENTS in
-- lib/applicationFormSchema.ts, which the server runs on every request, and
-- the board should be able to change it in one line rather than a migration.
alter table applications add column if not exists departments text[];

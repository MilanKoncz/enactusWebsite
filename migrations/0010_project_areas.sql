-- Lets the board maintain the application form's "Wunschbereich" checkbox
-- list themselves instead of it being hardcoded (derived from active
-- projects + board roles in ApplicationForm.tsx). No precedent in this
-- codebase for an active flag or a sort order (calendar_events deliberately
-- has neither) -- both are new here, needed specifically because this list
-- changes every semester and the board needs to retire an area without
-- losing it from applications that already reference it.
--
-- applications.desired_areas already stores raw strings, not a foreign key
-- (migrations/0001_init.sql) -- deactivating or renaming a row here can
-- never break a historic application, which is the whole point of that
-- design; nothing needs to change there.
create table if not exists project_areas (
  id uuid primary key default gen_random_uuid(),
  label_de text not null,
  label_en text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_areas_sort_order_idx on project_areas (sort_order);

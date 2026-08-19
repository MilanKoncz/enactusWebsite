-- The Jobwall: partner companies' open positions, entered by the board only
-- (no partner self-service, no partner login — see docs/content-guide.md).
-- Purely additive: no existing table is touched by this migration.
--
-- employment_type/remote as text + check, not a Postgres enum — same
-- reasoning as calendar_events_category_check in
-- migrations/0006_calendar_events.sql: no enum type exists anywhere else in
-- this schema, and a check constraint can be altered with a plain migration
-- later. Both value sets are mirrored in src/content/jobs.ts; keep the two
-- in sync.
--
-- partner_slug is a plain, unconstrained text column, not a foreign key:
-- partners live in src/content/partners.ts, not in the database, so there is
-- no table here to reference. It's validated against that content file's
-- slugs in src/lib/jobPostingFormSchema.ts instead.
--
-- expires_at is a plain date, not timestamptz — a posting expires on a
-- calendar day the board typed, the same reasoning
-- migrations/0006_calendar_events.sql gives for start_date/end_date.
create table if not exists job_postings (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  title text not null,
  employment_type text not null,
  location text,
  remote text not null,
  description text,
  apply_url text not null,
  expires_at date not null,
  partner_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_postings_company_not_blank check (length(btrim(company)) > 0),
  constraint job_postings_title_not_blank check (length(btrim(title)) > 0),
  constraint job_postings_apply_url_not_blank check (length(btrim(apply_url)) > 0),
  constraint job_postings_employment_type_check check (
    employment_type in ('praktikum', 'werkstudent', 'abschlussarbeit', 'einstieg')
  ),
  constraint job_postings_remote_check check (remote in ('vor_ort', 'hybrid', 'remote'))
);

-- The one filter both the public /jobs page and the daily cleanup route
-- need: "which rows are still current / how far past expires_at is a row".
create index if not exists job_postings_expires_at_idx on job_postings (expires_at);

-- Moves the application windows (Bewerbungsfenster) out of
-- content/recruiting.ts and into the database, so the board can add,
-- edit, or remove a cycle from /admin/bewerbungsfenster without a code
-- change and a deploy. content/recruiting.ts keeps the Zod schema and the
-- semester-label regex as the shared type definition — the data lives here.
--
-- No `exclude using gist` constraint for overlap-freeness: that needs the
-- btree_gist extension, and a failed `create extension` mid-file would
-- abort scripts/migrate.mjs partway through without recording the file in
-- schema_migrations (it has no transaction wrapping, see its own comment).
-- Overlap is instead checked in the admin route with a plain
-- `tstzrange(starts_at, ends_at, '[]') && tstzrange($1, $2, '[]')` query —
-- adequate for a single shared admin session with no concurrent editors.
create table if not exists recruiting_windows (
  id uuid primary key default gen_random_uuid(),
  semester text not null unique,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint recruiting_windows_semester_format check (semester ~ '^(HWS|FSS)[0-9]{2}$'),
  constraint recruiting_windows_end_after_start check (ends_at > starts_at)
);

create index if not exists recruiting_windows_starts_at_idx on recruiting_windows (starts_at);

-- Carries over the one window the board had confirmed in
-- content/recruiting.ts (2026-08-15, HWS26) so the migration doesn't start
-- the public site from an empty, "unscheduled" state.
insert into recruiting_windows (semester, starts_at, ends_at)
values ('HWS26', '2026-09-01T00:00:00+02:00', '2026-09-13T23:59:00+02:00')
on conflict (semester) do nothing;

-- Interview-availability preferences: a board asks applicants when they can
-- attend an interview, not a booking system. No reservation, no capacity,
-- no collision handling — interviews run in parallel and a slot can be
-- chosen by any number of applicants. The board assigns actual interviews
-- themselves, outside this schema.
--
-- Days and the time range live on recruiting_windows, not hardcoded
-- anywhere: an interview slot belongs to exactly one recruiting cycle, the
-- board already maintains that row every semester at
-- /admin/bewerbungsfenster, and every mutation there already calls
-- revalidateTag(RECRUITING_WINDOWS_TAG) — one more column set on the same
-- row costs no new cache wiring. Plain columns, not a child table like
-- application_area_choices (migrations/0017): an interview day carries
-- nothing besides its own date, no priority, no reason — the same
-- reasoning that made departments (migrations/0020) a single array column
-- rather than a table of its own.
--
-- `time`, not `timestamptz`, for the daily range: "10 bis 19 Uhr" is a
-- wall-clock rule repeated on every configured day, not a fixed instant.
-- Turning a (day, time) pair into an actual instant happens once per slot,
-- at generation time, via wallClockToInstant (lib/recruitingTime.ts) — the
-- one DST-correct conversion this project already uses for a board
-- member's typed time.
alter table recruiting_windows
  add column if not exists interview_days date[] not null default '{}',
  add column if not exists interview_start_time time not null default '10:00',
  add column if not exists interview_end_time time not null default '19:00',
  add column if not exists interview_slot_minutes integer not null default 60;

alter table recruiting_windows
  add constraint recruiting_windows_interview_range
    check (interview_end_time > interview_start_time);
alter table recruiting_windows
  add constraint recruiting_windows_interview_slot_minutes
    check (interview_slot_minutes between 5 and 480);

-- Carries over the two interview days already confirmed for HWS26 (the
-- board's own instruction for this feature), the same one-time nachtrag
-- 0003_recruiting_windows.sql already did for the window itself. Only
-- touches a row that has no interview days configured yet — every later
-- semester is entered through the admin form.
update recruiting_windows
set interview_days = '{2026-09-15,2026-09-16}'::date[]
where semester = 'HWS26' and interview_days = '{}';

-- NULL means "this application predates the field" (or: the window it
-- belongs to had no interview days configured at submission time); an
-- empty array means "asked, nothing chosen" — the same distinction
-- migrations/0020's own comment already draws for departments, and for
-- the same reason: displaying both as nothing costs nothing, and either
-- way avoids inventing a fact ("declined every slot") an applicant never
-- stated. No default, no backfill.
alter table applications add column if not exists interview_slots timestamptz[];

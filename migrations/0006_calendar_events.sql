-- The board's own event calendar (Termine), shown on the homepage and
-- managed at /admin/termine — the same move recruiting_windows made in
-- migrations/0003_recruiting_windows.sql: a board with yearly turnover
-- needs to add or move a date without a code change and a deploy. There is
-- deliberately no visibility flag: internal-only events are never entered
-- into this table at all, they're managed elsewhere, so every row here is
-- public by construction.
--
-- date/time, not timestamptz: an event is a wall-calendar fact (a day, or a
-- day plus a clock time the board typed), not an instant a deadline flips
-- at — recruiting_windows needed timestamptz because open/closed is decided
-- by comparing against "now" to the minute; a calendar entry only needs to
-- be grouped by month and sorted by day. This also sidesteps the DST
-- question entirely for the stored data; Europe/Berlin is only applied at
-- the point an .ics file is generated (src/lib/ics.ts).
--
-- category as text + check, not a Postgres enum: no enum type exists
-- anywhere else in this schema (see the locale and mail_status columns in
-- migrations/0001_init.sql and 0004), and a check constraint can be altered
-- with a plain migration later, where an enum type needs its own ALTER TYPE
-- dance. The seven values and their order are mirrored in
-- src/content/calendar.ts.
--
-- title_en/description_en are nullable from the start: the board maintains
-- this table directly in German (see HANDOFF.md), but adding the columns
-- now costs two lines and avoids a second migration the day someone wants
-- an English entry.
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_en text,
  category text not null,
  start_date date not null,
  end_date date,
  start_time time,
  end_time time,
  location text,
  description text,
  description_en text,
  tentative boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_title_not_blank check (length(btrim(title)) > 0),
  constraint calendar_events_category_check check (
    category in ('innolab', 'projekte', 'journeys', 'wettkaempfe', 'socials', 'workshops', 'bewerbung')
  ),
  constraint calendar_events_end_date_not_before_start check (end_date is null or end_date >= start_date),
  -- An end time with no start time has nothing to be "after": reject it
  -- outright rather than silently treating the event as starting at
  -- midnight.
  constraint calendar_events_end_time_needs_start_time check (end_time is null or start_time is not null),
  -- "End after start" only has to hold same-day: once end_date is a later
  -- calendar day than start_date, any end_time is valid (a multi-day event
  -- can legitimately end at 08:00 on its last day, earlier in the clock
  -- than a 09:00 start on its first).
  constraint calendar_events_end_time_after_start check (
    end_time is null
    or start_time is null
    or (end_date is not null and end_date > start_date)
    or end_time > start_time
  )
);

-- The one ordering the public agenda and the admin list both need.
create index if not exists calendar_events_start_date_idx on calendar_events (start_date);

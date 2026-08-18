-- Seeds the 22 dates the board confirmed from the HWS26/FSS27 semester
-- plan, exactly as given — nothing added, nothing inferred (see
-- ASSETS-TODO.md for what was deliberately left out: two tentative
-- ConnectUs dates, an unconfirmed November workshop, National Cup/ESA 2027,
-- and journeys/projekte, both still without a single date).
--
-- Kept in its own migration, separate from 0006_calendar_events.sql: a
-- migration only ever runs once, recorded by filename in
-- schema_migrations (scripts/migrate.mjs) — any row added here after 0006
-- had already been applied against Neon would silently never execute.
--
-- The unique index gives `on conflict do nothing` a natural key to match
-- against, so re-running this file is a no-op rather than a duplicate
-- insert. Three titles repeat across different dates (Kick-off ×2,
-- Initiativenmarkt ×2, Bewerbungsgespräche ×2, ConnectUs ×3) — none
-- collide under (category, start_date, title), checked by hand against all
-- 22 rows before writing this.
create unique index if not exists calendar_events_natural_key_idx
  on calendar_events (category, start_date, title);

insert into calendar_events (title, category, start_date, end_date, start_time, end_time, tentative)
values
  ('Q-Summit', 'wettkaempfe', '2026-09-02', null, null, null, false),
  ('Initiativenmarkt', 'bewerbung', '2026-09-01', null, null, null, false),
  ('Bewerbungsstart HWS26', 'bewerbung', '2026-09-01', null, null, null, false),
  ('ConnectUs und offenes Social', 'socials', '2026-09-05', null, null, null, false),
  ('Initiativentreffen', 'bewerbung', '2026-09-07', null, null, null, false),
  ('Kick-off', 'bewerbung', '2026-09-08', null, null, null, false),
  ('Kick-off', 'bewerbung', '2026-09-11', null, null, null, false),
  ('Bewerbungsschluss HWS26', 'bewerbung', '2026-09-13', null, null, null, false),
  ('Bewerbungsgespräche', 'bewerbung', '2026-09-15', '2026-09-16', null, null, false),
  ('Connectabend', 'socials', '2026-09-18', null, null, null, false),
  ('Ideathon', 'innolab', '2026-09-24', '2026-09-27', null, null, false),
  -- The semester plan lists this over three days, but only one day actually
  -- happens — see the seeded row's tentative flag, not a range, per the
  -- board's own clarification.
  ('ConnectUs', 'socials', '2026-10-05', null, null, null, true),
  ('Teamwochenende', 'socials', '2026-10-02', '2026-10-04', null, null, false),
  ('Startup Crawl', 'socials', '2026-10-07', null, '16:00', '21:00', false),
  ('Trainingswochenende', 'workshops', '2026-10-16', '2026-10-18', null, null, false),
  ('Social Innovation Bar', 'socials', '2026-10-20', null, null, null, false),
  ('ConnectUs', 'socials', '2026-11-02', null, null, null, true),
  ('Bewerbungsstart FSS27', 'bewerbung', '2027-02-01', null, null, null, false),
  ('Initiativenmarkt', 'bewerbung', '2027-02-15', null, null, null, false),
  ('Kick-off', 'bewerbung', '2027-02-17', null, null, null, false),
  ('Bewerbungsschluss FSS27', 'bewerbung', '2027-02-19', null, null, null, false),
  ('Bewerbungsgespräche', 'bewerbung', '2027-02-21', null, null, null, false)
on conflict (category, start_date, title) do nothing;

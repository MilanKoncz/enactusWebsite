-- Lets the application form point a visitor at the Ideathon once they've
-- chosen the area that leads into it, without hardcoding a label string
-- anywhere: project_areas.label_de/label_en are free text the board can
-- rename at any time (ApplicationForm.tsx reads them fresh from
-- /api/project-areas on every load), so the hint has to key off something
-- that survives a rename. A boolean flag the board sets themselves at
-- /admin/wunschbereiche is that key.
--
-- Default false, not null: every existing area keeps behaving exactly as
-- before until the board deliberately switches one on. Deactivating or
-- deleting the flagged area removes the hint for free — an inactive area
-- never reaches listActiveProjectAreas(), and a deleted one no longer
-- exists to match against.
alter table project_areas
  add column if not exists ideathon_hint boolean not null default false;

-- One-time backfill for whatever the board already named the InnoLab area,
-- matched loosely by label rather than an exact string, since this is the
-- last time anything here reads the label as a fact rather than free text.
-- Sets nothing if no such row exists yet (the 0011 seed shipped no InnoLab
-- area at all) — the board switches the flag on themselves once they add
-- one, same as any other area.
update project_areas
set ideathon_hint = true, updated_at = now()
where label_de ilike '%innolab%' or label_en ilike '%innolab%';

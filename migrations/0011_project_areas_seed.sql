-- Seeds today's checkbox list exactly as ApplicationForm.tsx currently
-- computes it (active projects' names, then deduplicated board roles, in
-- that order) so the board takes over an unchanged list, not a
-- reinterpreted one. label_de = label_en throughout: these are project and
-- role names, not translated UI copy.
--
-- Own migration file, not appended to 0010: schema_migrations records by
-- filename (scripts/migrate.mjs), so seed rows added after 0010 already
-- ran would silently never execute.
create unique index if not exists project_areas_label_de_idx on project_areas (label_de);

insert into project_areas (label_de, label_en, sort_order) values
  ('SmileGreen', 'SmileGreen', 1),
  ('Mealyo', 'Mealyo', 2),
  ('ReSoap', 'ReSoap', 3),
  ('ImpactWithUs', 'ImpactWithUs', 4),
  ('Team-Lead', 'Team-Lead', 5),
  ('Finance-Lead', 'Finance-Lead', 6),
  ('Operations-Lead', 'Operations-Lead', 7),
  ('Inno-Lead', 'Inno-Lead', 8),
  ('C&C Lead', 'C&C Lead', 9)
on conflict (label_de) do nothing;

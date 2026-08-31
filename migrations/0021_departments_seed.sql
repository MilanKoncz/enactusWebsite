-- Its own file rather than part of 0020, same reason 0011 is separate from
-- 0010: scripts/migrate.mjs records applied migrations by filename, so a seed
-- that might later need a correction has to be its own recorded step.
--
-- These five rows are not invented. They have been in project_areas since the
-- 0011 seed, sitting in the same ranked list as the actual projects
-- (SmileGreen, Mealyo, ReSoap, ImpactWithUs) even though they are positions,
-- not project areas. Moving them here is the whole point of 0020.
insert into departments (label_de, label_en, sort_order) values
  ('Team-Lead', 'Team-Lead', 1),
  ('Finance-Lead', 'Finance-Lead', 2),
  ('Operations-Lead', 'Operations-Lead', 3),
  ('Inno-Lead', 'Inno-Lead', 4),
  ('C&C Lead', 'C&C Lead', 5)
on conflict (label_de) do nothing;

-- Deactivated, never deleted: applications that already chose one keep their
-- text either way (the label is a snapshot), but the row stays visible and
-- reactivatable at /admin/wunschbereiche. Matched by label because that is
-- what the 0011 seed set and what the unique index guarantees; a board that
-- has since renamed one of these keeps it, which is the safe direction.
update project_areas
set active = false, updated_at = now()
where label_de in ('Team-Lead', 'Finance-Lead', 'Operations-Lead', 'Inno-Lead', 'C&C Lead');

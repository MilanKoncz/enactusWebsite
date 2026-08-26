-- Board feedback 2026-08-26: /ideathon's signup form drops "Hochschule"
-- (every attendee is already a University of Mannheim student, so the field
-- never carried information) and gains three fields — a capped free-text
-- list of team members, a capped free-text motivation/experience answer,
-- and a dietary preference picked from a fixed list.
--
-- dietary_preference is a closed set, not free text: a free-text field here
-- would collect allergies and intolerances, which is Art. 9 GDPR health
-- data this form must not capture (see the Datenschutzerklärung's Ideathon
-- section and IdeathonSignupForm.tsx's own hint, which points allergy/
-- intolerance reports to email instead).
alter table ideathon_signups drop column if exists university;

alter table ideathon_signups
  add column if not exists team_members text check (char_length(team_members) <= 300),
  add column if not exists motivation_experience text check (char_length(motivation_experience) <= 1000),
  add column if not exists dietary_preference text
    check (dietary_preference in ('omnivore', 'vegetarian', 'vegan', 'halal', 'kosher', 'noAnswer'));

-- Backfill before NOT NULL: any row inserted before this migration ran
-- predates the field entirely, so there is no real answer to preserve —
-- "noAnswer" is the honest label for that, same as a visitor who
-- deliberately picks it today.
update ideathon_signups set dietary_preference = 'noAnswer' where dietary_preference is null;

alter table ideathon_signups alter column dietary_preference set not null;

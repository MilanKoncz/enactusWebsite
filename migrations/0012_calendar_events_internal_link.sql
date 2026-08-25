-- A general-purpose optional link from a calendar entry to a page on this
-- site, so the board can point any future event at its own dedicated page
-- (e.g. the Ideathon) themselves, from /admin/termine, without a code
-- change. Nullable text, not a foreign key: the target is a route path
-- (checked to start with "/" in content/calendar.ts, the same shape
-- content/navigation.ts's hrefSchema already uses for the site's own nav
-- links), not a row in another table.
alter table calendar_events add column if not exists internal_link text;

-- Wire up the existing Ideathon 2026 row from the 0007 seed migration to
-- its new dedicated page — the first real use of the column above, not a
-- second, page-specific mechanism.
update calendar_events set internal_link = '/ideathon' where title = 'Ideathon' and internal_link is null;

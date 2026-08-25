-- Fills in the Ideathon 2026 row's location, left null by the 0007 seed
-- migration (which only ever set title/category/dates). The value is real,
-- from the board's own idea.html draft, not invented — /ideathon reads its
-- "Wo" fact and the .ics export read this same location, rather than
-- repeating the address as separate static page copy (one source of truth,
-- same reasoning as 0012's internal_link).
update calendar_events
set location = 'MAFINEX, Mannheim'
where title = 'Ideathon' and location is null;

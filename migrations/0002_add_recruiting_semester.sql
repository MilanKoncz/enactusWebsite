-- Labels every application with the recruiting cycle (content/recruiting.ts)
-- it was submitted into. Named recruiting_semester, not semester — that
-- column already exists and means the applicant's own semester of study
-- (applicationFormSchema.ts), a completely different fact.
--
-- Added nullable, backfilled from created_at using the same fallback rule
-- lib/recruitingSemester.ts applies to new rows (März–September -> HWS of
-- that year, Oktober–Februar -> FSS of the following year), then made
-- required — any row inserted before this migration ran predates the
-- column entirely, so there is no real per-row label to preserve, only
-- this stated derivation rule to apply retroactively.
alter table applications add column if not exists recruiting_semester text;

update applications set recruiting_semester = (
  case
    when extract(month from created_at) between 3 and 9
      then 'HWS' || to_char(created_at, 'YY')
    when extract(month from created_at) >= 10
      then 'FSS' || to_char(created_at + interval '1 year', 'YY')
    else 'FSS' || to_char(created_at, 'YY')
  end
) where recruiting_semester is null;

alter table applications alter column recruiting_semester set not null;

create index if not exists applications_recruiting_semester_idx on applications (recruiting_semester);

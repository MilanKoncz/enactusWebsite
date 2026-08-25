-- The Ideathon's own signup form (/ideathon), entirely separate from
-- `applications` (/mitmachen) — different event, different field list, and
-- the two forms must be able to change independently of each other. Purely
-- additive: no existing table is touched.
--
-- Same mail_status trio as every other form table (applications,
-- contact_messages, reminder_signups) — pending/sent/failed, so a signup is
-- never lost just because Resend had a bad moment (docs/engineering.md).
create table if not exists ideathon_signups (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  university text not null,
  study_program text not null,
  semester int not null,
  has_idea boolean not null,
  -- Capped in the schema (lib/ideathonSignupFormSchema.ts) and again here:
  -- this field can hold an unpublished business idea over a public form and
  -- mail pipeline, so the length discipline isn't left to one layer alone.
  idea_description text check (char_length(idea_description) <= 1000),
  registering_as_team boolean not null,
  team_size int,
  heard_about_us text,
  -- Which language the confirmation mail goes out in (mailDispatch.ts reads
  -- this the same way it reads applications.locale) — the submitting
  -- page's locale, not a preference field the visitor fills in.
  locale text not null check (locale in ('de', 'en')),
  -- Acknowledgment of the privacy notice, not consent as the legal basis
  -- (Art. 6(1)(b) — this is a participation registration, the data is
  -- processed to run the event itself) — see the Datenschutzerklärung
  -- section added alongside this table.
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  mail_status text not null default 'pending' check (mail_status in ('pending', 'sent', 'failed')),
  mailed_at timestamptz,
  mail_error text
);

create index if not exists ideathon_signups_created_at_idx on ideathon_signups (created_at);
create index if not exists ideathon_signups_mail_status_idx on ideathon_signups (mail_status);

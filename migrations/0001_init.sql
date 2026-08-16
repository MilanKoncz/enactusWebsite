-- Applications, the reminder list's double opt-in, contact messages, and the
-- rate limiter shared across all three form routes. One migration for all
-- four tables: they ship together and nothing here depends on data that
-- would need a separate backfill step.
--
-- No multi-statement transactions anywhere in lib/db.ts on purpose (see its
-- own comment) — every mutation there is a single atomic statement, so this
-- schema needs no columns to support in-flight transactional state.

-- Applications carry no IP address: the privacy policy's field list doesn't
-- name one, and selection doesn't need it (data minimisation). mail_status
-- exists so the board can find an application whose PDF never went out —
-- the exact case /api/bewerbung is designed to allow without losing data.
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  email text not null,
  study_program text not null,
  semester integer not null,
  university text not null,
  prior_involvement text,
  languages_skills text,
  motivation text not null,
  desired_areas text[] not null,
  availability_hours integer not null,
  heard_about_us text,
  consent_at timestamptz not null,
  locale text not null check (locale in ('de', 'en')),
  mail_status text not null default 'pending' check (mail_status in ('pending', 'sent', 'failed')),
  mail_error text,
  mailed_at timestamptz
);

create index if not exists applications_mail_status_idx on applications (mail_status);
create index if not exists applications_created_at_idx on applications (created_at);

-- Two separate tokens, not one: a confirmation link that leaks (forwarded
-- email, browser history on a shared machine) must not double as an
-- unsubscribe link for someone else's address.
create table if not exists reminder_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null unique,
  confirm_token text not null unique,
  unsubscribe_token text not null unique,
  confirmed boolean not null default false,
  confirmed_at timestamptz,
  confirmation_ip text,
  unsubscribed_at timestamptz,
  locale text not null check (locale in ('de', 'en'))
);

create index if not exists reminder_signups_created_at_idx on reminder_signups (created_at);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  locale text not null check (locale in ('de', 'en')),
  mail_status text not null default 'pending' check (mail_status in ('pending', 'sent', 'failed')),
  mail_error text
);

create index if not exists contact_messages_created_at_idx on contact_messages (created_at);

-- One row per (bucket, window) pair, upserted with an atomic increment —
-- see lib/db.ts's consumeRateLimit for the single-statement read+increment
-- this is built for. bucket is "<route>:<sha256(ip)>"; the IP itself is
-- never stored, only its hash.
create table if not exists rate_limit_hits (
  bucket text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (bucket, window_start)
);

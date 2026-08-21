-- Tracks the "an application window just opened" mail sent to confirmed
-- reminder_signups rows. The unique constraint below is the entire
-- once-per-(subscriber, window) guarantee: sending is a claim-then-send
-- insert (`on conflict (reminder_signup_id, recruiting_window_id) do
-- nothing returning id`) against this table, so a second cron run on the
-- same day, a cron run overlapping the admin's manual-trigger button, or a
-- retried request can never double-send. No in-memory or timestamp-based
-- state does any of that work -- the database does.
--
-- semester and window_ends_at are copied onto the row rather than joined
-- from recruiting_windows at read time, matching the same reasoning
-- listFailedMails already uses for storing email redundantly per source: a
-- later resend from /admin/mails needs to rebuild the exact mail it sent
-- without a join, and a row must still be self-describing after its window
-- (or even its signup) has since been deleted.
create table if not exists reminder_window_mails (
  id uuid primary key default gen_random_uuid(),
  reminder_signup_id uuid not null references reminder_signups(id) on delete cascade,
  recruiting_window_id uuid not null references recruiting_windows(id) on delete cascade,
  email text not null,
  locale text not null check (locale in ('de', 'en')),
  semester text not null,
  window_ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  mail_status text not null default 'pending' check (mail_status in ('pending', 'sent', 'failed')),
  mail_error text,
  mailed_at timestamptz,
  constraint reminder_window_mails_once_per_signup_and_window
    unique (reminder_signup_id, recruiting_window_id)
);

create index if not exists reminder_window_mails_mail_status_idx on reminder_window_mails (mail_status);

-- The cron route logs the reminder-window job as its own cron_runs row
-- (job = 'reminder-window'), separate from the existing cleanup row, so a
-- failure in one job's error string is never conflated with the other's.
-- These two columns stay at their default 0 on every cleanup row, exactly
-- as the four existing deleted_/pruned_ columns now stay at 0 on a
-- reminder-window row.
alter table cron_runs
  add column if not exists sent_reminder_window_mails integer not null default 0,
  add column if not exists failed_reminder_window_mails integer not null default 0;

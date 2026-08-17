-- reminder_signups is the one of the three form tables with no mail
-- bookkeeping: /api/reminder logged a failed confirmation send to the
-- console and moved on, so a subscriber who never received their
-- double-opt-in link was invisible. /admin/mails needs all three tables to
-- answer the same question, so this adds the same three columns
-- applications already has.
alter table reminder_signups
  add column if not exists mail_status text not null default 'pending',
  add column if not exists mail_error text,
  add column if not exists mailed_at timestamptz;

-- Every pre-existing row predates the column and was mailed under the old,
-- unrecorded path. Leaving them at the 'pending' default would claim their
-- confirmation mail was never attempted, which is the opposite of what
-- happened -- they are marked 'sent', with created_at as the best available
-- send time (the real one was never written down). Only signups created
-- after this migration start genuinely 'pending'.
update reminder_signups
set mail_status = 'sent', mailed_at = created_at
where mail_status = 'pending';

alter table reminder_signups
  add constraint reminder_signups_mail_status_check
  check (mail_status in ('pending', 'sent', 'failed'));

create index if not exists reminder_signups_mail_status_idx on reminder_signups (mail_status);

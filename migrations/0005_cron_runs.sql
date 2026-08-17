-- Records every /api/cron/cleanup execution so /admin/system can answer
-- "did the retention routine actually run?" without anyone reading Vercel's
-- logs -- which on this plan are kept for a day, long enough to miss a
-- problem that started last week.
--
-- This exists because the cron demonstrably missed its slot once already:
-- the job was registered correctly (vercel crons ls confirmed it) and still
-- did not fire at 03:00 UTC. Nothing in the product noticed. Now it will.
create table if not exists cron_runs (
  id uuid primary key default gen_random_uuid(),
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  -- Defaults to false and is set true only once every step has settled, so
  -- a run that dies partway through is distinguishable from one that
  -- completed -- an interrupted run leaves ok = false and finished_at null
  -- rather than silently looking like a success.
  ok boolean not null default false,
  deleted_applications integer not null default 0,
  deleted_contact_messages integer not null default 0,
  deleted_reminder_signups integer not null default 0,
  pruned_rate_limit_hits integer not null default 0,
  error text
);

-- The only query this table serves is "most recent runs first".
create index if not exists cron_runs_started_at_idx on cron_runs (started_at desc);

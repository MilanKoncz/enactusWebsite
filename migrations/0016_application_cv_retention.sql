-- Adds the CV upload columns and a per-row retention deadline to
-- applications, plus the counters the cron cleanup route's new CV-blob
-- pass reports through cron_runs.
--
-- retain_until replaces a *live calculation* with a value fixed once, at
-- insert time (lib/db.ts's insertApplication). It exists because the
-- Datenschutzerklärung already promises "{months} Monate nach Ende des
-- jeweiligen Bewerbungszeitraums" (Datenschutz.retention.rows,
-- de.json/en.json), while lib/retentionCutoff.ts computes a rolling
-- created_at + 6 months instead -- a real mismatch between the published
-- text and the code, not a rounding difference. That rolling calculation
-- was itself a deliberate fix for an earlier, window-anchored version that
-- silently froze once nobody entered a new recruiting window (see
-- lib/retentionCutoff.ts's own comment) -- so the fix here can't just go
-- back to computing the window-anchored date live. Instead the deadline is
-- computed once, from whatever window was open at submission time, and
-- stored: it can't drift after the fact, and it can't freeze, because
-- nothing re-derives it later. A CV's blob and its application row now
-- share this exact value, so the blob can never outlive the retention
-- promise made about it, and never gets orphaned by the two expiring on
-- different schedules.
--
-- Existing rows have no recruiting window worth reconstructing (some
-- predate recruiting_windows entirely -- see migrations/0002's own backfill
-- for the same situation with recruiting_semester), so they're backfilled
-- with the same created_at + 6 months the code already computes for them
-- today. This changes no row's fate, only where the number now lives.
alter table applications
  add column if not exists cv_blob_url text,
  add column if not exists cv_pathname text,
  add column if not exists cv_original_filename text,
  add column if not exists cv_size_bytes integer,
  add column if not exists cv_uploaded_at timestamptz,
  add column if not exists retain_until timestamptz;

update applications set retain_until = created_at + interval '6 months' where retain_until is null;

alter table applications alter column retain_until set not null;

-- Serves the orphan-blob reconciliation pass (lib/cvBlob.ts's listCvBlobs
-- results checked against this column).
create index if not exists applications_cv_pathname_idx
  on applications (cv_pathname) where cv_pathname is not null;

-- Serves the retention batch's own query (cv_pathname is not null and
-- retain_until <= now()) -- partial, since the vast majority of
-- applications before this feature shipped, and every application without
-- a CV, never match it.
create index if not exists applications_cv_retain_until_idx
  on applications (retain_until) where cv_pathname is not null;

-- Same pattern as migrations/0009's cron_runs columns for the
-- reminder-window job: a third, independently-logged pass (job =
-- 'cv-blobs') gets its own counters, left at 0 on every other job's row.
alter table cron_runs
  add column if not exists deleted_cv_blobs integer not null default 0,
  add column if not exists deleted_orphan_blobs integer not null default 0,
  add column if not exists remaining_cv_blobs integer not null default 0;

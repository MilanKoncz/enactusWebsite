import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  deleteExpiredApplications,
  deleteExpiredContactMessages,
  deleteExpiredIdeathonSignups,
  deleteExpiredJobPostings,
  deleteExpiredReminderSignups,
  finishCronRun,
  findRecruitingWindowsNeedingReminderMail,
  pruneRateLimitHits,
  startCronRun,
} from "@/lib/db";
import {
  applicationRetentionCutoff,
  contactMessageRetentionCutoff,
  ideathonSignupRetentionCutoff,
  jobPostingRetentionCutoff,
  reminderSignupRetentionCutoff,
  rateLimitHitRetentionCutoff,
} from "@/lib/retentionCutoff";
import { sendReminderWindowMailsForWindow } from "@/lib/reminderWindowMail";

/**
 * Two independently-logged jobs behind one route, because Vercel Cron on
 * this project fires once a day and both jobs need that same daily slot:
 *
 * 1. **cleanup** — enforces content/retention.ts, deleting whatever
 *    lib/retentionCutoff.ts says has expired. Reachable manually via
 *    `npm run db:cleanup` for a deployment where Cron isn't available.
 * 2. **reminder-window** — mails everyone confirmed on the reminder list
 *    once an application window has opened (lib/reminderWindowMail.ts),
 *    at most once per (signup, window) pair, enforced by the database.
 *
 * Each runs in its own try/catch with its own startCronRun/finishCronRun
 * pair: a thrown error in one — including a failure to even record the
 * run's start — is caught and logged, then the handler proceeds to the
 * other regardless. Neither job's failure can suppress the other's work or
 * its cron_runs row, which matters most on exactly the days both jobs
 * actually have something to do.
 *
 * Auth is a single shared secret compared with a constant-time comparison
 * — not `===`, which leaks timing information about how many leading
 * bytes matched. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`
 * automatically once CRON_SECRET is set as a project env var; with no
 * secret configured, every request is rejected rather than left open.
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  const expected = `Bearer ${secret}`;
  if (!header || header.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

async function runCleanupJob(now: Date) {
  // Recorded before the work starts, so a run that dies partway through
  // still leaves evidence it was attempted (cron_runs, migrations/0005).
  // Wrapped because the audit trail must never be the thing that stops the
  // cleanup from happening: if this insert fails, the deletes still run,
  // just unrecorded.
  const runId = await startCronRun("cleanup").catch((error: unknown) => {
    console.error("Failed to record the start of the cleanup run", error);
    return null;
  });

  const [applications, contactMessages, reminderSignups, jobPostings, rateLimitHits, ideathonSignups] =
    await Promise.allSettled([
      deleteExpiredApplications(applicationRetentionCutoff(now)),
      deleteExpiredContactMessages(contactMessageRetentionCutoff(now)),
      deleteExpiredReminderSignups(reminderSignupRetentionCutoff(now)),
      deleteExpiredJobPostings(jobPostingRetentionCutoff(now)),
      pruneRateLimitHits(rateLimitHitRetentionCutoff(now)),
      deleteExpiredIdeathonSignups(ideathonSignupRetentionCutoff(now)),
    ]);

  // jobPostings and ideathonSignups aren't part of the counts object below:
  // cron_runs (migrations/0005_cron_runs.sql) has no deleted_job_postings or
  // deleted_ideathon_signups column, and both tables are purely additive —
  // so these deletions run and are reported in the response body, but don't
  // get a persisted per-run count the way the other four do.
  const summary = {
    applications: applications.status === "fulfilled" ? applications.value : null,
    contactMessages: contactMessages.status === "fulfilled" ? contactMessages.value : null,
    reminderSignups: reminderSignups.status === "fulfilled" ? reminderSignups.value : null,
    rateLimitHits: rateLimitHits.status === "fulfilled" ? rateLimitHits.value : null,
  };
  const jobPostingsDeleted = jobPostings.status === "fulfilled" ? jobPostings.value : null;
  const ideathonSignupsDeleted = ideathonSignups.status === "fulfilled" ? ideathonSignups.value : null;

  const failures: string[] = [];
  for (const [name, result] of Object.entries({
    applications,
    contactMessages,
    reminderSignups,
    jobPostings,
    rateLimitHits,
    ideathonSignups,
  })) {
    if (result.status === "rejected") {
      console.error(`Cleanup step "${name}" failed`, result.reason);
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
      failures.push(`${name}: ${reason}`);
    }
  }

  if (runId) {
    await finishCronRun(runId, summary, failures.length > 0 ? failures.join("; ") : null).catch(
      (error: unknown) => {
        console.error("Failed to record the end of the cleanup run", error);
      },
    );
  }

  return { ...summary, jobPostings: jobPostingsDeleted, ideathonSignups: ideathonSignupsDeleted };
}

async function runReminderWindowJob(now: Date) {
  const runId = await startCronRun("reminder-window").catch((error: unknown) => {
    console.error("Failed to record the start of the reminder-window run", error);
    return null;
  });

  let sent = 0;
  let failed = 0;
  let error: string | null = null;

  try {
    const windows = await findRecruitingWindowsNeedingReminderMail(now);
    for (const window of windows) {
      const result = await sendReminderWindowMailsForWindow(window);
      sent += result.sent;
      failed += result.failed;
    }
  } catch (caught) {
    console.error("Reminder-window job failed", caught);
    error = caught instanceof Error ? caught.message : String(caught);
  }

  if (runId) {
    await finishCronRun(runId, { sentReminderWindowMails: sent, failedReminderWindowMails: failed }, error).catch(
      (finishError: unknown) => {
        console.error("Failed to record the end of the reminder-window run", finishError);
      },
    );
  }

  return { sent, failed, error };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Both jobs already record their own failures internally (every DB call
  // above is wrapped) and so never throw in practice — these try/catches
  // are the explicit guarantee, not a hope: whatever happens inside
  // runCleanupJob, runReminderWindowJob still runs, and vice versa.
  let deleted: Awaited<ReturnType<typeof runCleanupJob>> | null = null;
  try {
    deleted = await runCleanupJob(now);
  } catch (error) {
    console.error("Cleanup job threw outside its own error handling", error);
  }

  let reminderWindowMails: Awaited<ReturnType<typeof runReminderWindowJob>> | null = null;
  try {
    reminderWindowMails = await runReminderWindowJob(now);
  } catch (error) {
    console.error("Reminder-window job threw outside its own error handling", error);
  }

  return NextResponse.json({ ok: true, deleted, reminderWindowMails });
}

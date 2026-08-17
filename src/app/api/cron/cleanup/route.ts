import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  deleteExpiredApplications,
  deleteExpiredContactMessages,
  deleteExpiredReminderSignups,
  finishCronRun,
  pruneRateLimitHits,
  startCronRun,
} from "@/lib/db";
import {
  applicationRetentionCutoff,
  contactMessageRetentionCutoff,
  reminderSignupRetentionCutoff,
  rateLimitHitRetentionCutoff,
} from "@/lib/retentionCutoff";

/**
 * Enforces content/retention.ts, on a schedule — a stated retention period
 * with nothing deleting expired rows would just be a promise nobody
 * checks. Triggered daily by Vercel Cron (vercel.json), and reachable
 * manually via `npm run db:cleanup` for a deployment where Cron isn't
 * available. Both paths hit this exact route, so there is exactly one
 * implementation of "when is a row expired" — this handler, reading
 * content/retention.ts, not a second copy in a script.
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

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Recorded before the work starts, so a run that dies partway through
  // still leaves evidence it was attempted (cron_runs, migrations/0005).
  // Wrapped because the audit trail must never be the thing that stops the
  // cleanup from happening: if this insert fails, the deletes still run,
  // just unrecorded.
  const runId = await startCronRun("cleanup").catch((error: unknown) => {
    console.error("Failed to record the start of the cleanup run", error);
    return null;
  });

  const [applications, contactMessages, reminderSignups, rateLimitHits] = await Promise.allSettled([
    deleteExpiredApplications(applicationRetentionCutoff(now)),
    deleteExpiredContactMessages(contactMessageRetentionCutoff(now)),
    deleteExpiredReminderSignups(reminderSignupRetentionCutoff(now)),
    pruneRateLimitHits(rateLimitHitRetentionCutoff(now)),
  ]);

  const summary = {
    applications: applications.status === "fulfilled" ? applications.value : null,
    contactMessages: contactMessages.status === "fulfilled" ? contactMessages.value : null,
    reminderSignups: reminderSignups.status === "fulfilled" ? reminderSignups.value : null,
    rateLimitHits: rateLimitHits.status === "fulfilled" ? rateLimitHits.value : null,
  };

  const failures: string[] = [];
  for (const [name, result] of Object.entries({ applications, contactMessages, reminderSignups, rateLimitHits })) {
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

  return NextResponse.json({ ok: true, deleted: summary });
}

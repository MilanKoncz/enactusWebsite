import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  deleteExpiredApplications,
  deleteExpiredContactMessages,
  deleteExpiredReminderSignups,
  pruneRateLimitHits,
} from "@/lib/db";
import { applicationRetentionCutoff } from "@/lib/retentionCutoff";
import { retention } from "@/content/retention";
import { recruitingWindow } from "@/content/recruiting";

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
  const closesAt = recruitingWindow.closesAt ? new Date(recruitingWindow.closesAt) : null;

  const applicationsCutoff = applicationRetentionCutoff(now, closesAt);
  const contactMessagesCutoff = new Date(now);
  contactMessagesCutoff.setUTCMonth(contactMessagesCutoff.getUTCMonth() - retention.contactMessages.months);
  const reminderUnconfirmedCutoff = new Date(now);
  reminderUnconfirmedCutoff.setUTCDate(
    reminderUnconfirmedCutoff.getUTCDate() - retention.reminderSignupsUnconfirmed.days,
  );
  const rateLimitCutoff = new Date(now);
  rateLimitCutoff.setUTCDate(rateLimitCutoff.getUTCDate() - 1);

  const [applications, contactMessages, reminderSignups, rateLimitHits] = await Promise.allSettled([
    deleteExpiredApplications(applicationsCutoff),
    deleteExpiredContactMessages(contactMessagesCutoff),
    deleteExpiredReminderSignups(reminderUnconfirmedCutoff),
    pruneRateLimitHits(rateLimitCutoff),
  ]);

  const summary = {
    applications: applications.status === "fulfilled" ? applications.value : null,
    contactMessages: contactMessages.status === "fulfilled" ? contactMessages.value : null,
    reminderSignups: reminderSignups.status === "fulfilled" ? reminderSignups.value : null,
    rateLimitHits: rateLimitHits.status === "fulfilled" ? rateLimitHits.value : null,
  };

  for (const [name, result] of Object.entries({ applications, contactMessages, reminderSignups, rateLimitHits })) {
    if (result.status === "rejected") console.error(`Cleanup step "${name}" failed`, result.reason);
  }

  return NextResponse.json({ ok: true, deleted: summary });
}

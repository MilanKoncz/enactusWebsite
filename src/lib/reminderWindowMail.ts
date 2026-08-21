import {
  claimReminderWindowMail,
  findConfirmedReminderSignups,
  markReminderWindowMailFailed,
  markReminderWindowMailSent,
} from "@/lib/db";
import type { ConfirmedReminderSignup, RecruitingWindowRow } from "@/lib/db";
import { dispatchReminderWindowOpen } from "@/lib/mailDispatch";

/**
 * Shared by the cron's reminder-window job (api/cron/cleanup) and the
 * admin's manual-trigger button (api/admin/erinnerungen/fenster) — one
 * implementation, so the unique constraint that makes both paths safe
 * against double-sending is exercised identically by either, not
 * re-implemented twice with room for the two to drift.
 *
 * Sends in bounded-concurrency batches, not one signup at a time and not
 * all at once: a fully sequential loop over a large confirmed list risks
 * running the whole route past its serverless function timeout (Vercel's
 * current default is generous — 300s under Fluid Compute — but nothing in
 * this repo pins that, so the mitigation doesn't depend on the exact
 * number). MAX_PER_RUN caps how much a single invocation attempts;
 * anyone left over is simply picked up by the next cron run or a repeated
 * manual trigger, because detection
 * (findRecruitingWindowsNeedingReminderMail's NOT EXISTS query) is
 * self-healing — nobody is skipped, worst case is a delay, not a failure.
 */
const CONCURRENCY = 10;
const MAX_PER_RUN = 200;

export type ReminderWindowMailResult = { sent: number; failed: number };

export async function sendReminderWindowMailsForWindow(
  window: Pick<RecruitingWindowRow, "id" | "semester" | "end">,
): Promise<ReminderWindowMailResult> {
  const signups = (await findConfirmedReminderSignups()).slice(0, MAX_PER_RUN);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < signups.length; i += CONCURRENCY) {
    const chunk = signups.slice(i, i + CONCURRENCY);
    const outcomes = await Promise.all(chunk.map((signup) => sendOne(signup, window)));
    for (const outcome of outcomes) {
      if (outcome === "sent") sent += 1;
      else if (outcome === "failed") failed += 1;
    }
  }

  return { sent, failed };
}

async function sendOne(
  signup: ConfirmedReminderSignup,
  window: Pick<RecruitingWindowRow, "id" | "semester" | "end">,
): Promise<"sent" | "failed" | "skipped"> {
  // The insert's own on-conflict-do-nothing is the entire race guard: zero
  // rows back means another cron run, or the manual button racing it,
  // already claimed this exact (signup, window) pair — no send attempted.
  const claimId = await claimReminderWindowMail({
    reminderSignupId: signup.id,
    recruitingWindowId: window.id,
    email: signup.email,
    locale: signup.locale,
    semester: window.semester,
    windowEndsAt: window.end,
  });
  if (!claimId) return "skipped";

  try {
    await dispatchReminderWindowOpen({
      email: signup.email,
      locale: signup.locale,
      unsubscribeToken: signup.unsubscribeToken,
      semester: window.semester,
      windowEndsAt: window.end,
    });
    await markReminderWindowMailSent(claimId);
    return "sent";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markReminderWindowMailFailed(claimId, message).catch((markError: unknown) => {
      console.error("Failed to record the reminder-window mail failure itself", markError);
    });
    return "failed";
  }
}

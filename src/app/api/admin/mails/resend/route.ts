import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import {
  findApplicationById,
  findContactMessageById,
  findIdeathonSignupById,
  findReminderSignupById,
  findReminderWindowMailById,
  markApplicationMailed,
  markApplicationMailFailed,
  markContactMessageMailed,
  markContactMessageMailFailed,
  markIdeathonSignupMailed,
  markIdeathonSignupMailFailed,
  markReminderMailed,
  markReminderMailFailed,
  markReminderWindowMailFailed,
  markReminderWindowMailSent,
} from "@/lib/db";
import {
  dispatchApplicationMails,
  dispatchContactNotification,
  dispatchIdeathonSignupMails,
  dispatchReminderAlreadyRegistered,
  dispatchReminderConfirmation,
  dispatchReminderWindowOpen,
} from "@/lib/mailDispatch";

/**
 * Retries the notification for one record the board picked out of
 * /admin/mails, then records the outcome on that row so the list reflects
 * it immediately.
 *
 * Unlike the public form routes, a failure here is reported plainly: the
 * board pressed a button and is owed the truth about whether it worked,
 * where a visitor is told their submission succeeded (it did — it's stored)
 * regardless of the mail. The provider's message goes back in the response
 * as well as onto the row, because the person reading it is the person who
 * can act on it.
 */
// `z.guid()`, not `z.uuid()`: the stricter one additionally requires RFC
// 9562 version and variant bits, which the Postgres `uuid` column type does
// not guarantee — it stores any 128-bit value. This check exists to keep
// obvious junk away from the query, not to re-specify what a uuid is, and
// rejecting an id the database would happily have found would be a bug in
// the validator rather than a caught attack.
const requestSchema = z.object({
  source: z.enum([
    "applications",
    "contact_messages",
    "reminder_signups",
    "reminder_window_mails",
    "ideathon_signups",
  ]),
  id: z.guid(),
});

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const { source, id } = parsed.data;

  try {
    const found = await resend(source, id);
    if (!found) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
  } catch (error) {
    console.error(`Failed to resend mail for ${source} ${id}`, error);
    const message = error instanceof Error ? error.message : String(error);
    await recordFailure(source, id, message).catch((markError: unknown) => {
      console.error("Failed to record the resend failure itself", markError);
    });
    return NextResponse.json({ ok: false, error: "send_failed", message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

// Returns false only when the row is genuinely gone (deleted between the
// page render and the click), which is a 404 rather than a send failure —
// nothing to retry and nothing to mark.
async function resend(source: string, id: string): Promise<boolean> {
  if (source === "applications") {
    const application = await findApplicationById(id);
    if (!application) return false;
    await dispatchApplicationMails(application);
    await markApplicationMailed(id);
    return true;
  }

  if (source === "contact_messages") {
    const message = await findContactMessageById(id);
    if (!message) return false;
    await dispatchContactNotification(message);
    await markContactMessageMailed(id);
    return true;
  }

  if (source === "reminder_signups") {
    const signup = await findReminderSignupById(id);
    if (!signup) return false;
    // A confirmed row's failed send can only be the "you're already
    // registered" notice (dispatchReminderAlreadyRegistered) — that mail
    // has carried mail_status since /api/reminder started sending it
    // (2026-08-30). Re-sending the double opt-in *confirmation* to an
    // already-confirmed row would be confusing at best, so which mail gets
    // resent still depends on signup.confirmed, same as the original send.
    if (signup.confirmed) {
      await dispatchReminderAlreadyRegistered(signup);
    } else {
      await dispatchReminderConfirmation(signup);
    }
    await markReminderMailed(id);
    return true;
  }

  if (source === "ideathon_signups") {
    const signup = await findIdeathonSignupById(id);
    if (!signup) return false;
    await dispatchIdeathonSignupMails(signup);
    await markIdeathonSignupMailed(id);
    return true;
  }

  // reminder_window_mails: rebuilds the exact mail from the row's own
  // stored semester/windowEndsAt (no join to recruiting_windows — the row
  // outlives a since-deleted window, same reasoning as the other sources
  // storing email redundantly). No "already succeeded" guard is needed
  // here the way reminder_signups has one: the list only ever offers a
  // mail_status = 'failed' row, and a failed send never confirmed anything
  // that a resend could double up on.
  const windowMail = await findReminderWindowMailById(id);
  if (!windowMail) return false;
  await dispatchReminderWindowOpen(windowMail);
  await markReminderWindowMailSent(id);
  return true;
}

async function recordFailure(source: string, id: string, message: string): Promise<void> {
  if (source === "applications") return markApplicationMailFailed(id, message);
  if (source === "contact_messages") return markContactMessageMailFailed(id, message);
  if (source === "reminder_signups") return markReminderMailFailed(id, message);
  if (source === "ideathon_signups") return markIdeathonSignupMailFailed(id, message);
  return markReminderWindowMailFailed(id, message);
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { reminderRequestSchema } from "@/lib/apiSchemas";
import { markReminderMailed, markReminderMailFailed, upsertReminderSignup } from "@/lib/db";
import { dispatchReminderConfirmation } from "@/lib/mailDispatch";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/requestIp";
import { generateToken } from "@/lib/tokens";

/**
 * Double opt-in, step one. This route only ever writes an unconfirmed row
 * and sends a confirmation-request email — nothing here can subscribe
 * anyone without them clicking the link in that email
 * (/api/reminder/bestaetigen). An already-confirmed address gets the same
 * `{ ok: true }` response with no second email, so repeating this request
 * can't be used to probe who's signed up.
 */
export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit("reminder", clientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reminderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const data = parsed.data;

  let result;
  try {
    result = await upsertReminderSignup(data.email, generateToken(), generateToken(), data.locale);
  } catch (error) {
    console.error("Failed to persist reminder signup", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  if (!result.confirmed) {
    try {
      await dispatchReminderConfirmation({
        email: data.email,
        locale: data.locale,
        confirmToken: result.confirmToken,
        unsubscribeToken: result.unsubscribeToken,
      });
      await markReminderMailed(result.id);
    } catch (error) {
      // The row is already saved; a failed confirmation email just means
      // this particular attempt didn't reach the inbox. Recorded on the
      // row — not only logged — so /admin/mails can show it and offer a
      // resend; a console line nobody reads is how a subscriber who never
      // got their link stayed invisible before.
      console.error("Failed to send reminder confirmation email", error);
      const message = error instanceof Error ? error.message : String(error);
      await markReminderMailFailed(result.id, message).catch((markError: unknown) => {
        console.error("Failed to record the reminder mail failure itself", markError);
      });
    }
  }

  return NextResponse.json({ ok: true });
}

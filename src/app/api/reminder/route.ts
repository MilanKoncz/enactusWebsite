import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { reminderRequestSchema } from "@/lib/apiSchemas";
import { upsertReminderSignup } from "@/lib/db";
import { sendReminderConfirmationEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/requestIp";
import { generateToken } from "@/lib/tokens";
import { siteUrl } from "@/lib/siteUrl";

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
      const t = await getTranslations({ locale: data.locale, namespace: "Mail.reminderConfirmation" });
      const base = siteUrl();
      const unsubscribeUrl = `${base}/api/reminder/abmelden?token=${result.unsubscribeToken}`;
      await sendReminderConfirmationEmail({
        email: data.email,
        subject: t("subject"),
        text: t("body", {
          confirmUrl: `${base}/api/reminder/bestaetigen?token=${result.confirmToken}`,
          unsubscribeUrl,
        }),
        unsubscribeUrl,
      });
    } catch (error) {
      // The row is already saved; a failed confirmation email just means
      // this particular attempt didn't reach the inbox. Logged, not
      // retried automatically — the visitor can resubmit the same form,
      // which safely reuses/renews the same unconfirmed row.
      console.error("Failed to send reminder confirmation email", error);
    }
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { contactRequestSchema } from "@/lib/apiSchemas";
import { insertContactMessage, markContactMessageMailed, markContactMessageMailFailed } from "@/lib/db";
import { sendContactMessageNotification } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/requestIp";

/**
 * Same ordering guarantee as /api/bewerbung: the message is written to
 * Postgres before any mail is attempted, and a failed forward to the
 * board's inbox doesn't lose it — it's logged and the sender still hears
 * back that their message went through, because it did.
 */
export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit("kontakt", clientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contactRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const data = parsed.data;

  let message;
  try {
    message = await insertContactMessage({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      locale: data.locale,
    });
  } catch (error) {
    console.error("Failed to persist contact message", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  try {
    const t = await getTranslations({ locale: data.locale, namespace: "Mail.contactNotification" });
    await sendContactMessageNotification({
      name: message.name,
      email: message.email,
      subject: t("subject", { name: message.name }),
      text: `${message.name} (${message.email}) schreibt${message.subject ? ` zum Thema „${message.subject}“` : ""}:\n\n${message.message}`,
    });
    await markContactMessageMailed(message.id);
  } catch (error) {
    console.error("Failed to forward contact message", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await markContactMessageMailFailed(message.id, errorMessage).catch((markError) => {
      console.error("Failed to record the mail failure itself", markError);
    });
  }

  return NextResponse.json({ ok: true });
}

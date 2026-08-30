import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { unsubscribeReminder } from "@/lib/db";
import { localizedPath } from "@/lib/localizedPath";
import { siteUrl } from "@/lib/siteUrl";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/requestIp";

/**
 * GET handles a human clicking the unsubscribe link in an email — it
 * redirects to /erinnerung-status?status=<state>, the same real
 * confirmation page bestaetigen/route.ts sends its own clicks to, so an
 * unsubscribe click gets visible feedback too, not a silent landing on
 * /mitmachen. POST handles RFC 8058's one-click unsubscribe: a compliant
 * mail client (Gmail, Yahoo, …) reads List-Unsubscribe-Post on the
 * original email and POSTs here directly, with no page load — that
 * request expects a bare 2xx, not a redirect, so the two methods return
 * genuinely different response shapes rather than sharing one handler.
 *
 * Both are rate-limited for the same reason as bestaetigen/route.ts: an
 * unauthenticated route that runs one UPDATE per call needs its own bound,
 * not just whatever a mail client's own retry behavior happens to be. GET's
 * rate-limited redirect uses its own "rate-limited" status, not "invalid" —
 * see bestaetigen/route.ts's comment on why those must stay distinct.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const base = siteUrl();
  const statusUrl = (status: string, locale: "de" | "en" = "de") =>
    new URL(`${localizedPath("/erinnerung-status", locale)}?status=${status}`, base);

  const rateLimit = await checkRateLimit("reminder-abmelden", clientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.redirect(statusUrl("rate-limited"));
  }

  if (!token) {
    return NextResponse.redirect(statusUrl("invalid"));
  }

  const result = await unsubscribeReminder(token).catch((error: unknown) => {
    console.error("Failed to unsubscribe reminder signup", error);
    return null;
  });

  if (!result || result.status === "invalid") {
    return NextResponse.redirect(statusUrl("invalid"));
  }
  return NextResponse.redirect(statusUrl(result.status, result.locale));
}

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit("reminder-abmelden", clientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  const result = await unsubscribeReminder(token).catch((error: unknown) => {
    console.error("Failed to unsubscribe reminder signup", error);
    return null;
  });

  const ok = result?.status === "unsubscribed";
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}

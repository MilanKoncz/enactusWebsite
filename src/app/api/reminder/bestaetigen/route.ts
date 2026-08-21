import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { confirmReminderSignup } from "@/lib/db";
import { clientIp } from "@/lib/requestIp";
import { localizedPath } from "@/lib/localizedPath";
import { siteUrl } from "@/lib/siteUrl";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * Double opt-in, step two — the click that actually subscribes. The
 * conditional UPDATE inside confirmReminderSignup is the entire race
 * guard: a second click on the same link (or two racing clicks) finds
 * zero rows the second time round, since `confirmed` is already true by
 * then. Confirmation timestamp and IP are stored as the proof of consent
 * the Datenschutzerklärung promises.
 *
 * Every outcome lands on /erinnerung-status?status=<state> — a real,
 * visible confirmation page, not a silent redirect to /mitmachen — so
 * whoever clicked actually learns whether it worked. Locale is unknown
 * until confirmReminderSignup resolves (it's stored on the row, not the
 * request), so every early-exit path (missing token, rate limit, DB
 * error) falls back to German, same as the rest of this route always did.
 *
 * Rate-limited like every other form route: this is a public GET that
 * runs one UPDATE per call, and a link scanner or a script looping over
 * guessed tokens would otherwise have no bound at all on how many it can
 * try.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const base = siteUrl();
  const statusUrl = (status: string, locale: "de" | "en" = "de") =>
    new URL(`${localizedPath("/erinnerung-status", locale)}?status=${status}`, base);

  const rateLimit = await checkRateLimit("reminder-bestaetigen", clientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.redirect(statusUrl("invalid"));
  }

  if (!token) {
    return NextResponse.redirect(statusUrl("invalid"));
  }

  let result;
  try {
    result = await confirmReminderSignup(token, clientIp(request));
  } catch (error) {
    console.error("Failed to confirm reminder signup", error);
    return NextResponse.redirect(statusUrl("invalid"));
  }

  if (result.status === "invalid") {
    return NextResponse.redirect(statusUrl("invalid"));
  }
  return NextResponse.redirect(statusUrl(result.status, result.locale));
}

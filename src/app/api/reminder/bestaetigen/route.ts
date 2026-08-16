import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { confirmReminderSignup } from "@/lib/db";
import { clientIp } from "@/lib/requestIp";
import { localizedPath } from "@/lib/localizedPath";
import { siteUrl } from "@/lib/siteUrl";

/**
 * Double opt-in, step two — the click that actually subscribes. The
 * conditional UPDATE inside confirmReminderSignup is the entire race
 * guard: a second click on the same link (or two racing clicks) finds
 * zero rows the second time round, since `confirmed` is already true by
 * then. Confirmation timestamp and IP are stored as the proof of consent
 * the Datenschutzerklärung promises.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const base = siteUrl();

  if (!token) {
    return NextResponse.redirect(new URL(`${localizedPath("/mitmachen", "de")}?bestaetigt=fehler`, base));
  }

  let confirmed;
  try {
    confirmed = await confirmReminderSignup(token, clientIp(request));
  } catch (error) {
    console.error("Failed to confirm reminder signup", error);
    return NextResponse.redirect(new URL(`${localizedPath("/mitmachen", "de")}?bestaetigt=fehler`, base));
  }

  if (!confirmed) {
    return NextResponse.redirect(new URL(`${localizedPath("/mitmachen", "de")}?bestaetigt=fehler`, base));
  }

  return NextResponse.redirect(new URL(`${localizedPath("/mitmachen", confirmed.locale)}?bestaetigt=1`, base));
}

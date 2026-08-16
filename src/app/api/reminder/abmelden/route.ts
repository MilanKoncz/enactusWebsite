import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { unsubscribeReminder } from "@/lib/db";
import { localizedPath } from "@/lib/localizedPath";
import { siteUrl } from "@/lib/siteUrl";

/**
 * GET handles a human clicking the unsubscribe link in an email — it
 * redirects back to /mitmachen with a status flag, same pattern as
 * bestaetigen/route.ts. POST handles RFC 8058's one-click unsubscribe: a
 * compliant mail client (Gmail, Yahoo, …) reads List-Unsubscribe-Post on
 * the original email and POSTs here directly, with no page load — that
 * request expects a bare 2xx, not a redirect, so the two methods return
 * genuinely different response shapes rather than sharing one handler.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const base = siteUrl();

  if (!token) {
    return NextResponse.redirect(new URL(`${localizedPath("/mitmachen", "de")}?abgemeldet=fehler`, base));
  }

  const result = await unsubscribeReminder(token).catch((error: unknown) => {
    console.error("Failed to unsubscribe reminder signup", error);
    return null;
  });

  if (!result) {
    return NextResponse.redirect(new URL(`${localizedPath("/mitmachen", "de")}?abgemeldet=fehler`, base));
  }

  return NextResponse.redirect(new URL(`${localizedPath("/mitmachen", result.locale)}?abgemeldet=1`, base));
}

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  const result = await unsubscribeReminder(token).catch((error: unknown) => {
    console.error("Failed to unsubscribe reminder signup", error);
    return null;
  });

  return NextResponse.json({ ok: Boolean(result) }, { status: result ? 200 : 404 });
}

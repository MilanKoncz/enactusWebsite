import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/requestIp";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_MS, createSessionCookieValue, verifyPassword } from "@/lib/adminAuth";

// Same rate-limit shape as the public form routes (docs/engineering.md) —
// a login endpoint is exactly the kind of thing a flood is aimed at.
export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit("admin-login", clientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const password = body && typeof body === "object" && typeof body.password === "string" ? body.password : "";

  if (!verifyPassword(password)) {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  const cookieValue = createSessionCookieValue();
  if (!cookieValue) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
  });
  return response;
}

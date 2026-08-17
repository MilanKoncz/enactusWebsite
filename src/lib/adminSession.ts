import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionCookieValue } from "@/lib/adminAuth";

/**
 * The two ways the admin gate gets checked, in one place instead of copied
 * into every page and route that needs it.
 *
 * Deliberately *not* moved into the admin layout or into proxy.ts: a layout
 * renders its children regardless of what it returns itself, so the page
 * body — including its database query — would still execute. Every admin
 * page therefore calls `isAdminAuthenticated()` itself, before fetching
 * anything, and every admin route handler calls
 * `isAuthenticatedRequest()` before touching lib/db. That's the property
 * the tests assert: not "nothing is visible" but "the query was never
 * made".
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionCookieValue(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export function isAuthenticatedRequest(request: NextRequest): boolean {
  return verifySessionCookieValue(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

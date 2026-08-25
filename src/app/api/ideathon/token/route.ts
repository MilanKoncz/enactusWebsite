import { NextResponse } from "next/server";
import { createFormToken } from "@/lib/formToken";

/**
 * Issues the signed timing token IdeathonSignupForm.tsx fetches once on
 * mount — same mechanism as /api/bewerbung/token (lib/formToken.ts is
 * route-agnostic, so this is a thin, form-specific issuing endpoint rather
 * than a second implementation). No rate limit and no auth, same reasoning:
 * this reveals nothing beyond "a token was issued at time X", and /ideathon
 * is a public page anyone can already load as often as they like.
 */
export async function GET() {
  const token = createFormToken();
  if (!token) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  return NextResponse.json({ token });
}

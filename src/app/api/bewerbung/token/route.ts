import { NextResponse } from "next/server";
import { createFormToken } from "@/lib/formToken";

/**
 * Issues the signed timing token ApplicationForm.tsx fetches once on
 * mount and later submits back to /api/bewerbung (see formToken.ts for
 * why this replaced a client-supplied timestamp). No rate limit and no
 * auth: this reveals nothing beyond "a token was issued at time X",
 * which is useless to anyone without FORM_TOKEN_SECRET, and /mitmachen is
 * a public page anyone can already load as often as they like.
 */
export async function GET() {
  const token = createFormToken();
  if (!token) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  return NextResponse.json({ token });
}

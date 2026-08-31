import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createFormToken } from "@/lib/formToken";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/requestIp";

/**
 * Issues the signed timing token ApplicationForm.tsx fetches once on
 * mount and later submits back to /api/bewerbung (see formToken.ts for
 * why this replaced a client-supplied timestamp) — and, since the CV
 * upload shipped, also the token /api/bewerbung/cv-upload's
 * onBeforeGenerateToken requires before it will issue a client upload
 * token. That second use is why this route now carries a real rate limit
 * (lib/rateLimit.ts's "bewerbung-token" bucket) where it previously had
 * none: it used to reveal nothing beyond "a token was issued at time X",
 * useless to anyone without FORM_TOKEN_SECRET, but it's now the front
 * door to writing into the CV store. Still no auth beyond the rate limit
 * — /mitmachen is a public page anyone can already load as often as they
 * like, and the limit is generous enough that a genuine applicant should
 * never see it.
 *
 * A 429 here is a real, visible problem, not an anti-spam signal to hide:
 * ApplicationForm.tsx surfaces it as submitRateLimited rather than
 * silently leaving the form unable to submit.
 */
export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit("bewerbung-token", clientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const token = createFormToken();
  if (!token) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  return NextResponse.json({ token });
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ideathonSignupRequestSchema } from "@/lib/apiSchemas";
import { insertIdeathonSignup, markIdeathonSignupMailed, markIdeathonSignupMailFailed } from "@/lib/db";
import { dispatchIdeathonSignupMails } from "@/lib/mailDispatch";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/requestIp";
import { checkFormToken } from "@/lib/formToken";
import { getCalendarEvents } from "@/lib/calendarEvents";
import { findNextIdeathonEvent } from "@/lib/ideathonEvent";

/**
 * Same load-bearing ordering as /api/bewerbung: validate, write to
 * Postgres, then — only once that write has committed — send mail. A mail
 * failure and a Resend outage are handled identically, inside one
 * try/catch with no outward throw, because by that point the signup is
 * already safe.
 *
 * The honeypot and the signed form-token's minimum-fill-time check both
 * resolve to the same response as a genuine success (200, `{ ok: true }`) —
 * a bot gets no way to tell "you were flagged" from "it worked". An
 * *expired* token is not a spam signal (a genuine visitor left the tab open
 * too long), so that gets a real, distinguishable error, same as
 * /api/bewerbung.
 */
export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit("ideathon", clientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);

  if (body && typeof body === "object" && "website" in body && typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const parsed = ideathonSignupRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const data = parsed.data;

  const tokenStatus = checkFormToken(data.formToken);
  if (tokenStatus === "invalid" || tokenStatus === "too_fast") {
    return NextResponse.json({ ok: true });
  }
  if (tokenStatus === "expired") {
    return NextResponse.json({ ok: false, error: "form_expired" }, { status: 400 });
  }

  // The form only renders while an upcoming Ideathon is on the calendar
  // (IdeathonSteps.tsx/IdeathonCountdown.tsx), but a page can sit open in a
  // tab for hours — the route itself is public and reachable regardless of
  // what a tab already open still shows. Not a spam signal: a request that
  // fails this gets a real, distinguishable error, since the visitor did
  // nothing wrong. calendar_events (internal_link = "/ideathon") is the one
  // source both this check and the page's own countdown read from
  // (lib/ideathonEvent.ts) — no separate "is registration open" flag to
  // keep in sync.
  const events = await getCalendarEvents();
  if (!findNextIdeathonEvent(events, Date.now())) {
    return NextResponse.json({ ok: false, error: "signup_closed" }, { status: 409 });
  }

  let signup;
  try {
    signup = await insertIdeathonSignup({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      university: data.university,
      studyProgram: data.studyProgram,
      semester: data.semester,
      hasIdea: data.hasIdea,
      ideaDescription: data.ideaDescription,
      registeringAsTeam: data.registeringAsTeam,
      teamSize: data.teamSize,
      heardAboutUs: data.heardAboutUs,
      locale: data.locale,
    });
  } catch (error) {
    console.error("Failed to store Ideathon signup", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  try {
    await dispatchIdeathonSignupMails(signup);
    await markIdeathonSignupMailed(signup.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markIdeathonSignupMailFailed(signup.id, message).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applicationRequestSchema } from "@/lib/apiSchemas";
import { insertApplication, markApplicationMailed, markApplicationMailFailed } from "@/lib/db";
import { dispatchApplicationMails } from "@/lib/mailDispatch";
import { alertOnInsertFailure } from "@/lib/insertFailureAlert";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/requestIp";
import { checkFormToken } from "@/lib/formToken";
import { resolveApplicationSemester } from "@/lib/recruitingSemester";
import { getRecruitingWindows } from "@/lib/recruitingWindows";
import { recruitingPhaseAt } from "@/lib/recruitingStatus";

/**
 * The load-bearing ordering, per docs/engineering.md: validate, then write
 * to Postgres, then — only once that write has committed — render the PDF
 * and send mail. Everything from the PDF render onward sits inside one
 * try/catch with no outward throw: a render failure and a Resend failure
 * are handled identically, because by that point the application is
 * already safe and the only thing left to do is record whether the notice
 * went out.
 *
 * Both anti-spam signals — the honeypot and the signed form-token's
 * minimum-fill-time check (lib/formToken.ts) — resolve to the same response
 * as a genuine success (200, `{ ok: true }`), with nothing written and
 * nothing sent. A bot gets no way to tell "you were flagged" from "it
 * worked", which is the whole point of a silent signal: it stops being
 * useful once it's distinguishable from success. An *expired* token is not
 * an anti-spam signal — it's what a genuine applicant gets from leaving the
 * tab open too long — so that one case does get a real, distinguishable
 * error.
 */
export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit("bewerbung", clientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);

  if (body && typeof body === "object" && "website" in body && typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const parsed = applicationRequestSchema.safeParse(body);
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

  const recruitingWindows = await getRecruitingWindows();

  // The form only renders while a window is open (MitmachenApplication.tsx),
  // but that's a client-side gate on a page that can sit open in a tab for
  // hours — the route itself is public and reachable regardless of what the
  // page currently shows, so it has to enforce the same rule server-side.
  // Unlike the honeypot and timing checks above, this isn't a spam signal —
  // a request that fails it gets a real, distinguishable error, since the
  // applicant did nothing wrong.
  if (recruitingPhaseAt(Date.now(), recruitingWindows) !== "open") {
    return NextResponse.json({ ok: false, error: "window_closed" }, { status: 409 });
  }

  let application;
  try {
    application = await insertApplication({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      studyProgram: data.studyProgram,
      semester: data.semester,
      university: data.university,
      priorInvolvement: data.priorInvolvement,
      languagesSkills: data.languagesSkills,
      motivation: data.motivation,
      desiredAreas: data.desiredAreas,
      availabilityHours: data.availabilityHours,
      heardAboutUs: data.heardAboutUs,
      locale: data.locale,
      recruitingSemester: resolveApplicationSemester(new Date(), recruitingWindows),
    });
  } catch (error) {
    console.error("Failed to persist application", error);
    await alertOnInsertFailure("bewerbung", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  // From here on, the application is safely stored. Nothing below can lose
  // it — a failure just means the board and the applicant learn about it a
  // different way (see ASSETS-TODO.md / the applications.mail_status
  // column the board can check).
  try {
    await dispatchApplicationMails(application);
    await markApplicationMailed(application.id);
  } catch (error) {
    console.error("Failed to send application mail", error);
    const message = error instanceof Error ? error.message : String(error);
    await markApplicationMailFailed(application.id, message).catch((markError) => {
      console.error("Failed to record the mail failure itself", markError);
    });
  }

  return NextResponse.json({ ok: true });
}

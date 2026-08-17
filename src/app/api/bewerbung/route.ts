import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getTranslations } from "next-intl/server";
import { applicationRequestSchema } from "@/lib/apiSchemas";
import { insertApplication, markApplicationMailed, markApplicationMailFailed } from "@/lib/db";
import { sendApplicationConfirmation, sendApplicationNotification } from "@/lib/mail";
import { ApplicationPdfDocument } from "@/lib/applicationPdf";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/requestIp";
import { MIN_FILL_MS } from "@/lib/antiSpam";
import { resolveApplicationSemester } from "@/lib/recruitingSemester";
import { getRecruitingWindows } from "@/lib/recruitingWindows";

/**
 * The load-bearing ordering, per docs/engineering.md: validate, then write
 * to Postgres, then — only once that write has committed — render the PDF
 * and send mail. Everything from the PDF render onward sits inside one
 * try/catch with no outward throw: a render failure and a Resend failure
 * are handled identically, because by that point the application is
 * already safe and the only thing left to do is record whether the notice
 * went out.
 *
 * Both anti-spam signals — the honeypot and the minimum-fill-time check —
 * resolve to the same response as a genuine success (200, `{ ok: true }`),
 * with nothing written and nothing sent. A bot gets no way to tell "you
 * were flagged" from "it worked", which is the whole point of a silent
 * signal: it stops being useful once it's distinguishable from success.
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

  if (Date.now() - data.formRenderedAt < MIN_FILL_MS) {
    return NextResponse.json({ ok: true });
  }

  const recruitingWindows = await getRecruitingWindows();

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
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  // From here on, the application is safely stored. Nothing below can lose
  // it — a failure just means the board and the applicant learn about it a
  // different way (see ASSETS-TODO.md / the applications.mail_status
  // column the board can check).
  try {
    const pdfBuffer = await renderToBuffer(ApplicationPdfDocument({ application }));
    await sendApplicationNotification(application, pdfBuffer);

    const t = await getTranslations({ locale: data.locale, namespace: "Mail.applicationConfirmation" });
    await sendApplicationConfirmation({
      email: application.email,
      firstName: application.firstName,
      subject: t("subject"),
      text: t("body", { firstName: application.firstName }),
    });

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

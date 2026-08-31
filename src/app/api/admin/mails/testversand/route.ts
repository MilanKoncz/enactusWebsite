import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { renderToBuffer } from "@react-pdf/renderer";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import {
  dispatchApplicationMails,
  dispatchContactNotification,
  dispatchIdeathonSignupMails,
  dispatchReminderAlreadyRegistered,
  dispatchReminderConfirmation,
  dispatchReminderWindowOpen,
} from "@/lib/mailDispatch";
import { sendInsertFailureAlert } from "@/lib/mail";
import type { TestOverride } from "@/lib/mail";
import { putTestCvBlob, deleteCvBlobs } from "@/lib/cvBlob";
import type { Application, ContactMessage, IdeathonSignup } from "@/lib/db";
import { TestCvDocument } from "@/lib/testCvPdf";

const requestSchema = z.object({ to: z.email() });

const SUBJECT_PREFIX = "[TESTVERSAND]";

// Recognizably fake throughout — never a real name, never a real semester,
// so nobody skimming an inbox could mistake this for a genuine submission.
// Every mail's actual recipient is the `to` the board typed in, not
// whatever field below carries an email-shaped value (that field only
// exists because the real template requires it, e.g. the applicant's own
// email inside the notification's body text).
const FIRST_NAME = "Test";
const LAST_NAME = "Versand";
const NOW = new Date();
const RETAIN_UNTIL = new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 30);
const TEST_CV_PATHNAME = `bewerbungen/testversand-${NOW.getTime()}.pdf`;

function baseApplication(to: string, cv: boolean): Application {
  return {
    id: cv ? "00000000-0000-4000-8000-000000000001" : "00000000-0000-4000-8000-000000000002",
    createdAt: NOW,
    consentAt: NOW,
    mailStatus: "pending",
    mailError: null,
    mailedAt: null,
    firstName: FIRST_NAME,
    lastName: LAST_NAME,
    email: to,
    studyProgram: "Testfach B.Sc.",
    semester: 3,
    priorInvolvement: "Testeintrag für den Vorlagen-Testversand, kein echtes Engagement.",
    languagesSkills: "Testdaten — nicht echt.",
    motivation: "Dies ist ein Testversand über /admin/mails, um die Bewerbungs-Benachrichtigung zu prüfen. Kein echter Bewerbungstext.",
    wantToGain: "Testdaten für den Vorlagen-Testversand.",
    areaChoices: [{ priority: 1, areaLabel: "Testbereich", reason: "Testdaten für den Vorlagen-Testversand." }],
    availabilityHours: 8,
    heardAboutUs: "Testversand",
    locale: "de",
    recruitingSemester: "TEST00",
    retainUntil: RETAIN_UNTIL,
    ...(cv
      ? {
          cvBlobUrl: `https://blob.vercel-storage.com/${TEST_CV_PATHNAME}`,
          cvPathname: TEST_CV_PATHNAME,
          cvOriginalFilename: "testversand-lebenslauf.pdf",
          cvSizeBytes: 0,
          cvUploadedAt: NOW,
        }
      : {}),
  };
}

function fakeIdeathonSignup(to: string): IdeathonSignup {
  return {
    id: "00000000-0000-4000-8000-000000000003",
    createdAt: NOW,
    consentAt: NOW,
    mailStatus: "pending",
    mailError: null,
    mailedAt: null,
    firstName: FIRST_NAME,
    lastName: LAST_NAME,
    email: to,
    studyProgram: "Testfach B.Sc.",
    semester: 3,
    hasIdea: true,
    ideaDescription: "Testdaten für den Vorlagen-Testversand, keine echte Idee.",
    motivationExperience: "Testdaten für den Vorlagen-Testversand.",
    registeringAsTeam: true,
    teamSize: 3,
    teamMembers: "Test Eins, Test Zwei",
    dietaryPreference: "vegetarian",
    heardAboutUs: "Testversand",
    locale: "de",
  };
}

function fakeContactMessage(to: string): ContactMessage {
  return {
    id: "00000000-0000-4000-8000-000000000004",
    createdAt: NOW,
    name: `${FIRST_NAME} ${LAST_NAME}`,
    email: to,
    subject: "Testversand",
    message: "Dies ist ein Testversand über /admin/mails, um die Kontaktformular-Weiterleitung zu prüfen.",
    locale: "de",
  };
}

type TestSendResult = { key: string; label: string; ok: boolean; error?: string };

async function attempt(key: string, label: string, send: () => Promise<unknown>): Promise<TestSendResult> {
  try {
    await send();
    return { key, label, ok: true };
  } catch (error) {
    console.error(`Testversand: ${key} fehlgeschlagen`, error);
    return { key, label, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * The board's own way to see all ten real mail templates render for real —
 * in their own inbox, in Gmail and Outlook, light and dark — after any copy
 * change, without waiting for a genuine submission or resend to trigger
 * one. Calls the real dispatch- and send-prefixed functions with
 * recognizably fake data (see the constants above), never `@/lib/db` —
 * nothing here writes a row anywhere. Every mail is redirected to the
 * board's own `to` address
 * (never a hardcoded recipient) and its subject gets a `[TESTVERSAND]`
 * prefix (TestOverride, lib/mail.ts), so a stray copy in an inbox can never
 * be mistaken for the real thing.
 *
 * Ten sends, matching the ten real templates: the application notification
 * runs twice — once with a real (throwaway) CV attached through the exact
 * fetchCvBlobBuffer path a genuine application uses, once in the degraded
 * no-CV case — dispatchApplicationMails' own `parts` option keeps each of
 * those two calls to just the notification half, so the confirmation mail
 * (its own, separately listed item) doesn't fire twice more as a side
 * effect. Same reasoning for the two Ideathon sends.
 */
export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const { to } = parsed.data;
  const testOverride: TestOverride = { to, subjectPrefix: SUBJECT_PREFIX };

  let cvUploaded = false;
  try {
    const pdf = await renderToBuffer(TestCvDocument());
    await putTestCvBlob(TEST_CV_PATHNAME, pdf);
    cvUploaded = true;
  } catch (error) {
    console.error("Testversand: Test-Lebenslauf konnte nicht hochgeladen werden", error);
  }

  const results: TestSendResult[] = [];

  results.push(
    await attempt("applicationNotificationWithCv", "Bewerbungs-Benachrichtigung (mit Lebenslauf)", () =>
      dispatchApplicationMails(baseApplication(to, cvUploaded), {
        parts: { notification: true, confirmation: false },
        testOverride,
      }),
    ),
  );
  results.push(
    await attempt(
      "applicationNotificationWithoutCv",
      "Bewerbungs-Benachrichtigung (ohne Lebenslauf)",
      () =>
        dispatchApplicationMails(baseApplication(to, false), {
          parts: { notification: true, confirmation: false },
          testOverride,
        }),
    ),
  );
  results.push(
    await attempt("applicationConfirmation", "Bewerbungsbestätigung", () =>
      dispatchApplicationMails(baseApplication(to, false), {
        parts: { notification: false, confirmation: true },
        testOverride,
      }),
    ),
  );
  results.push(
    await attempt("ideathonNotification", "Ideathon-Benachrichtigung", () =>
      dispatchIdeathonSignupMails(fakeIdeathonSignup(to), {
        parts: { notification: true, confirmation: false },
        testOverride,
      }),
    ),
  );
  results.push(
    await attempt("ideathonConfirmation", "Ideathon-Bestätigung", () =>
      dispatchIdeathonSignupMails(fakeIdeathonSignup(to), {
        parts: { notification: false, confirmation: true },
        testOverride,
      }),
    ),
  );
  results.push(
    await attempt("reminderConfirmation", "Erinnerung: Double-Opt-in", () =>
      dispatchReminderConfirmation(
        { email: to, locale: "de", confirmToken: "testversand-confirm", unsubscribeToken: "testversand-unsub" },
        testOverride,
      ),
    ),
  );
  results.push(
    await attempt("reminderAlreadyRegistered", "Erinnerung: bereits angemeldet", () =>
      dispatchReminderAlreadyRegistered(
        { email: to, locale: "de", unsubscribeToken: "testversand-unsub" },
        testOverride,
      ),
    ),
  );
  results.push(
    await attempt("reminderWindowOpen", "Erinnerung: Fenster offen", () =>
      dispatchReminderWindowOpen(
        {
          email: to,
          locale: "de",
          unsubscribeToken: "testversand-unsub",
          semester: "TEST00",
          windowEndsAt: new Date(NOW.getTime() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        },
        testOverride,
      ),
    ),
  );
  results.push(
    await attempt("contactNotification", "Kontaktformular-Weiterleitung", () =>
      dispatchContactNotification(fakeContactMessage(to), testOverride),
    ),
  );
  results.push(
    await attempt("insertFailureAlert", "Insert-Failure-Alert", () =>
      sendInsertFailureAlert("testversand", "Simulierter Fehler für den Vorlagen-Testversand.", testOverride),
    ),
  );

  if (cvUploaded) {
    await deleteCvBlobs([TEST_CV_PATHNAME]).catch((error: unknown) => {
      console.error("Testversand: Test-Lebenslauf konnte nicht wieder gelöscht werden", error);
    });
  }

  return NextResponse.json({ ok: true, results });
}

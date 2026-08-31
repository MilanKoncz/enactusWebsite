import { Resend } from "resend";
import type { Application, IdeathonSignup } from "./db";
import { mailHtml, mailLogoAttachment } from "./mailLayout";

/**
 * The only file that talks to Resend. Every send goes through here so the
 * from/reply-to addresses and the "fail loudly, but never throw past the
 * caller who needs to keep going" contract live in one place.
 *
 * Client and every env-derived address are read lazily, inside each
 * function — not at module scope — for the same reason as lib/db.ts's
 * client: `next build` collects route metadata without running a request
 * handler, so a module-scope read would make these variables a build-time
 * requirement instead of a runtime one.
 *
 * Click and open tracking, and the tracking subdomain, are switched off at
 * the Resend domain level (enactus-mannheim.com's own dashboard setting) —
 * nothing here opts back into either per send, and nothing here could:
 * CreateEmailOptions has no tracking flag, only the domain does.
 */

let cachedClient: Resend | null = null;

function client(): Resend {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set — see .env.example and docs/deployment.md.");
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — see .env.example and docs/deployment.md.`);
  return value;
}

// The one thing /api/admin/mails/testversand needs from every sender below:
// redirect a mail that would otherwise go to a hardcoded board address (or
// a fake test address already in the caller's fabricated data) to the
// board member actually running the test, and mark the subject so it can
// never be mistaken for a real notification if it ends up forwarded or
// left in an inbox. Optional and trailing on every exported function here
// — every real caller (the public routes, /admin/mails's ordinary resend)
// omits it and gets exactly the behavior it always had.
export type TestOverride = { to: string; subjectPrefix: string };

// Every mail gets an HTML body (derived from the same plaintext every
// dispatch function already writes, mailLayout.ts's mailHtml) and the logo
// as an inline `cid:` attachment (mailLogoAttachment) — added here, once,
// rather than in each of the functions below, so none of them need to know
// this wrapper exists. Before this, every send was plaintext-only.
async function send(params: {
  to: string;
  subject: string;
  text: string;
  attachments?: { filename: string; content: Buffer }[];
  headers?: Record<string, string>;
  testOverride?: TestOverride;
}): Promise<string> {
  const result = await client().emails.send({
    from: requireEnv("RESEND_FROM_EMAIL"),
    replyTo: requireEnv("RESEND_REPLY_TO_EMAIL"),
    to: params.testOverride?.to ?? params.to,
    subject: params.testOverride ? `${params.testOverride.subjectPrefix} ${params.subject}` : params.subject,
    text: params.text,
    html: mailHtml(params.text),
    attachments: [mailLogoAttachment(), ...(params.attachments ?? [])],
    headers: params.headers,
  });
  if (result.error) throw new Error(result.error.message);
  return result.data.id;
}

// cvAttachment is null both when the application has no CV at all (a
// pre-CV-upload row, or the board already cleared it via "CV jetzt löschen")
// and when fetching it failed — mailDispatch.ts's dispatchApplicationMails
// is the one place that tells those two apart if it ever needs to; here
// they're the same case, "nothing to attach", and the text says so either
// way rather than guessing which one happened.
//
// Size: Resend's own limit is 40 MB per email (see the installed SDK's
// CreateEmailOptions doc comment). The upload path enforces a 4 MB cap on
// the CV itself (applicationFormSchema.ts's CV_MAX_SIZE_BYTES); the
// rendered application PDF is a single page in the tens of KB. Base64
// inflates raw bytes by roughly a third, so the worst case here is on the
// order of 5.5 MB — comfortably under Resend's limit even with both
// attachments present.
export async function sendApplicationNotification(
  application: Application,
  pdfBuffer: Buffer,
  cvAttachment: { filename: string; content: Buffer } | null,
  testOverride?: TestOverride,
): Promise<string> {
  const note = cvAttachment
    ? "\n\nHinweis zum Löschkonzept: retain_until löscht automatisch den Blob und die Datenbankzeile, nicht diesen Mailanhang. Bitte den Lebenslauf nach Ablauf der Aufbewahrungsfrist manuell aus diesem Postfach löschen."
    : "\n\nHinweis: Der Lebenslauf konnte dieser Mail nicht beigefügt werden. Er liegt weiterhin im Vorstandsbereich unter /admin/bewerbungen zum Download bereit.";
  return send({
    // testOverride?.to short-circuits requireEnv below via `??` — a test
    // send must work even where APPLICATION_RECIPIENT_EMAIL was never set
    // (see ASSETS-TODO.md), since it's never actually going to be used.
    to: testOverride?.to ?? requireEnv("APPLICATION_RECIPIENT_EMAIL"),
    subject: `Neue Bewerbung: ${application.firstName} ${application.lastName}`,
    text: `Neue Bewerbung von ${application.firstName} ${application.lastName} (${application.email}). Details im angehängten PDF${cvAttachment ? ", der Lebenslauf liegt als zweiter Anhang bei" : ""}.${note}`,
    attachments: cvAttachment
      ? [{ filename: `bewerbung-${application.id}.pdf`, content: pdfBuffer }, cvAttachment]
      : [{ filename: `bewerbung-${application.id}.pdf`, content: pdfBuffer }],
    testOverride,
  });
}

export async function sendApplicationConfirmation(
  params: {
    email: string;
    firstName: string;
    subject: string;
    text: string;
  },
  testOverride?: TestOverride,
): Promise<string> {
  return send({ to: params.email, subject: params.subject, text: params.text, testOverride });
}

export async function sendReminderConfirmationEmail(
  params: {
    email: string;
    subject: string;
    text: string;
    unsubscribeUrl: string;
  },
  testOverride?: TestOverride,
): Promise<string> {
  // One-click unsubscribe per RFC 8058: List-Unsubscribe-Post tells a
  // compliant mail client (Gmail, Yahoo, …) it may POST to the
  // List-Unsubscribe URL directly, with no page load and no confirmation
  // click — /api/reminder/abmelden's POST handler exists specifically to
  // answer that request. The angle brackets around the URL are required by
  // RFC 2369's List-Unsubscribe syntax, not decoration.
  return send({
    to: params.email,
    subject: params.subject,
    text: params.text,
    headers: {
      "List-Unsubscribe": `<${params.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    testOverride,
  });
}

// Sent instead of sendReminderConfirmationEmail when /api/reminder is
// called for an address that has already confirmed — see
// mailDispatch.ts's dispatchReminderAlreadyRegistered for why this exists.
// Same RFC 8058 one-click headers as its sibling: it reuses the
// subscriber's existing, never-rotated unsubscribe token, so the same
// /api/reminder/abmelden POST handler answers a click on either mail.
export async function sendReminderAlreadyRegisteredEmail(
  params: {
    email: string;
    subject: string;
    text: string;
    unsubscribeUrl: string;
  },
  testOverride?: TestOverride,
): Promise<string> {
  return send({
    to: params.email,
    subject: params.subject,
    text: params.text,
    headers: {
      "List-Unsubscribe": `<${params.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    testOverride,
  });
}

export async function sendReminderWindowOpenEmail(
  params: {
    email: string;
    subject: string;
    text: string;
    unsubscribeUrl: string;
  },
  testOverride?: TestOverride,
): Promise<string> {
  // Same RFC 8058 one-click headers as sendReminderConfirmationEmail — this
  // mail reuses the subscriber's existing unsubscribe token/link, so the
  // same POST handler (/api/reminder/abmelden) answers a click on either.
  return send({
    to: params.email,
    subject: params.subject,
    text: params.text,
    headers: {
      "List-Unsubscribe": `<${params.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    testOverride,
  });
}

// German labels for the board's own notification mail — this text is never
// shown to the visitor, so it doesn't go through next-intl (same reasoning
// as the CSV export routes' own hardcoded label maps).
const DIETARY_PREFERENCE_LABEL: Record<IdeathonSignup["dietaryPreference"], string> = {
  omnivore: "omnivor",
  vegetarian: "vegetarisch",
  vegan: "vegan",
  halal: "halal",
  kosher: "koscher",
  noAnswer: "keine Angabe",
};

// Same recipient as the membership application (APPLICATION_RECIPIENT_EMAIL,
// info@unimannheim.enactus.team) — board decision, 2026-08-25: the Ideathon
// notification doesn't need its own env var pointed at an identical address.
export async function sendIdeathonSignupNotification(
  signup: IdeathonSignup,
  testOverride?: TestOverride,
): Promise<string> {
  return send({
    to: testOverride?.to ?? requireEnv("APPLICATION_RECIPIENT_EMAIL"),
    subject: `Neue Ideathon-Anmeldung: ${signup.firstName} ${signup.lastName}`,
    text: `Neue Ideathon-Anmeldung von ${signup.firstName} ${signup.lastName} (${signup.email}), ${signup.studyProgram} (${signup.semester}. Fachsemester).\n\nEssenspräferenz: ${DIETARY_PREFERENCE_LABEL[signup.dietaryPreference]}${signup.motivationExperience ? `\nMotivation und bisherige Erfahrung: ${signup.motivationExperience}` : ""}\n\nIdee vorhanden: ${signup.hasIdea ? "ja" : "nein"}${signup.ideaDescription ? `\nIdeenbeschreibung: ${signup.ideaDescription}` : ""}\nMeldet sich als Team an: ${signup.registeringAsTeam ? "ja" : "nein"}${signup.teamSize ? ` (${signup.teamSize} Personen)` : ""}${signup.teamMembers ? `\nTeammitglieder: ${signup.teamMembers}` : ""}${signup.heardAboutUs ? `\nAufmerksam geworden durch: ${signup.heardAboutUs}` : ""}`,
    testOverride,
  });
}

export async function sendIdeathonSignupConfirmation(
  params: {
    email: string;
    firstName: string;
    subject: string;
    text: string;
  },
  testOverride?: TestOverride,
): Promise<string> {
  return send({ to: params.email, subject: params.subject, text: params.text, testOverride });
}

// Board-facing only, like DIETARY_PREFERENCE_LABEL above — never shown to a
// visitor, so it doesn't go through next-intl. Sent by lib/insertFailureAlert.ts
// when a form's database write fails, so a failure that a visitor already
// saw a real error for doesn't also go unnoticed by the board.
export async function sendInsertFailureAlert(
  route: string,
  errorMessage: string,
  testOverride?: TestOverride,
): Promise<string> {
  return send({
    to: testOverride?.to ?? requireEnv("APPLICATION_RECIPIENT_EMAIL"),
    subject: `Achtung: ${route}-Formular speichert nicht`,
    text: `Ein Absenden über ${route} konnte nicht in der Datenbank gespeichert werden.\n\nFehler: ${errorMessage}\n\nDie besuchende Person hat eine Fehlermeldung gesehen, aber wenn das öfter passiert, geht es sonst unbemerkt unter. Bitte /admin/system prüfen (Datenbankschema und Erreichbarkeit) und bei Bedarf technische Hilfe holen.`,
    testOverride,
  });
}

export async function sendContactMessageNotification(
  params: {
    name: string;
    email: string;
    subject: string;
    text: string;
  },
  testOverride?: TestOverride,
): Promise<string> {
  return send({
    to: testOverride?.to ?? requireEnv("RESEND_REPLY_TO_EMAIL"),
    subject: params.subject,
    text: params.text,
    testOverride,
  });
}

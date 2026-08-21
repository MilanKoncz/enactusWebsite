import { Resend } from "resend";
import type { Application } from "./db";

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

async function send(params: {
  to: string;
  subject: string;
  text: string;
  attachments?: { filename: string; content: Buffer }[];
  headers?: Record<string, string>;
}): Promise<string> {
  const result = await client().emails.send({
    from: requireEnv("RESEND_FROM_EMAIL"),
    replyTo: requireEnv("RESEND_REPLY_TO_EMAIL"),
    to: params.to,
    subject: params.subject,
    text: params.text,
    attachments: params.attachments,
    headers: params.headers,
  });
  if (result.error) throw new Error(result.error.message);
  return result.data.id;
}

export async function sendApplicationNotification(application: Application, pdfBuffer: Buffer): Promise<string> {
  return send({
    to: requireEnv("APPLICATION_RECIPIENT_EMAIL"),
    subject: `Neue Bewerbung: ${application.firstName} ${application.lastName}`,
    text: `Neue Bewerbung von ${application.firstName} ${application.lastName} (${application.email}). Details im angehängten PDF.`,
    attachments: [{ filename: `bewerbung-${application.id}.pdf`, content: pdfBuffer }],
  });
}

export async function sendApplicationConfirmation(params: {
  email: string;
  firstName: string;
  subject: string;
  text: string;
}): Promise<string> {
  return send({ to: params.email, subject: params.subject, text: params.text });
}

export async function sendReminderConfirmationEmail(params: {
  email: string;
  subject: string;
  text: string;
  unsubscribeUrl: string;
}): Promise<string> {
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
  });
}

export async function sendReminderWindowOpenEmail(params: {
  email: string;
  subject: string;
  text: string;
  unsubscribeUrl: string;
}): Promise<string> {
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
  });
}

export async function sendContactMessageNotification(params: {
  name: string;
  email: string;
  subject: string;
  text: string;
}): Promise<string> {
  return send({
    to: requireEnv("RESEND_REPLY_TO_EMAIL"),
    subject: params.subject,
    text: params.text,
  });
}

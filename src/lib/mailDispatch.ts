import { renderToBuffer } from "@react-pdf/renderer";
import { getTranslations } from "next-intl/server";
import { ApplicationPdfDocument } from "@/lib/applicationPdf";
import {
  sendApplicationConfirmation,
  sendApplicationNotification,
  sendContactMessageNotification,
  sendReminderConfirmationEmail,
} from "@/lib/mail";
import { siteUrl } from "@/lib/siteUrl";
import type { Application, ContactMessage, Locale } from "@/lib/db";

/**
 * What each form's notification actually *is* — composed once, called both
 * by the route that first handles a submission and by /admin/mails's
 * resend. That sharing is the whole point: a resend that rebuilt the
 * subject line or the body itself would quietly diverge from the original
 * the first time either was edited, and the board would be re-sending
 * something subtly different from what the applicant was promised.
 *
 * Every function here throws on failure and records nothing. Deciding what
 * a failure means — mark the row failed, tell the visitor anyway, surface
 * it to the board — belongs to the caller, because the answer differs: a
 * visitor is told their submission worked (it did, it's stored), while an
 * admin pressing "resend" is told plainly that it failed again.
 */
export async function dispatchApplicationMails(application: Application): Promise<void> {
  const pdfBuffer = await renderToBuffer(ApplicationPdfDocument({ application }));
  await sendApplicationNotification(application, pdfBuffer);

  const t = await getTranslations({
    locale: application.locale,
    namespace: "Mail.applicationConfirmation",
  });
  await sendApplicationConfirmation({
    email: application.email,
    firstName: application.firstName,
    subject: t("subject"),
    text: t("body", { firstName: application.firstName }),
  });
}

export async function dispatchContactNotification(message: ContactMessage): Promise<void> {
  const t = await getTranslations({ locale: message.locale, namespace: "Mail.contactNotification" });
  await sendContactMessageNotification({
    name: message.name,
    email: message.email,
    subject: t("subject", { name: message.name }),
    text: `${message.name} (${message.email}) schreibt${message.subject ? ` zum Thema „${message.subject}“` : ""}:\n\n${message.message}`,
  });
}

// Takes only the four fields the mail actually needs, not a whole row: the
// original send has just written the row and holds these in hand, while the
// resend reads them back — a wider parameter would force one of the two to
// invent values for fields nothing here reads.
export type ReminderConfirmationTarget = {
  email: string;
  locale: Locale;
  confirmToken: string;
  unsubscribeToken: string;
};

// Rebuilds the confirmation and unsubscribe links from the row's own
// tokens, so a resent mail points at exactly the same links as the first
// attempt — reissuing tokens here would invalidate a link the subscriber
// may already have sitting in their inbox.
export async function dispatchReminderConfirmation(signup: ReminderConfirmationTarget): Promise<void> {
  const t = await getTranslations({ locale: signup.locale, namespace: "Mail.reminderConfirmation" });
  const base = siteUrl();
  const unsubscribeUrl = `${base}/api/reminder/abmelden?token=${signup.unsubscribeToken}`;
  await sendReminderConfirmationEmail({
    email: signup.email,
    subject: t("subject"),
    text: t("body", {
      confirmUrl: `${base}/api/reminder/bestaetigen?token=${signup.confirmToken}`,
      unsubscribeUrl,
    }),
    unsubscribeUrl,
  });
}

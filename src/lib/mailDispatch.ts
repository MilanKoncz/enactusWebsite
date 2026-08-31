import { renderToBuffer } from "@react-pdf/renderer";
import { getTranslations } from "next-intl/server";
import { ApplicationPdfDocument } from "@/lib/applicationPdf";
import {
  sendApplicationConfirmation,
  sendApplicationNotification,
  sendContactMessageNotification,
  sendIdeathonSignupConfirmation,
  sendIdeathonSignupNotification,
  sendReminderAlreadyRegisteredEmail,
  sendReminderConfirmationEmail,
  sendReminderWindowOpenEmail,
} from "@/lib/mail";
import type { TestOverride } from "@/lib/mail";
import { localizedPath } from "@/lib/localizedPath";
import { formatSiteDateTime } from "@/lib/formatSiteDateTime";
import { siteUrl } from "@/lib/siteUrl";
import { fetchCvBlobBuffer } from "@/lib/cvBlob";
import type { Application, ContactMessage, IdeathonSignup, Locale } from "@/lib/db";

// Every sendXxx call below passes testOverride as a trailing argument — but
// an explicit `undefined` is still a real, present argument to a mock, not
// the same as one omitted entirely. Every real caller never sets
// testOverride at all, and several existing tests assert an exact call
// shape on the mocked @/lib/mail senders (bewerbung.test.ts, ideathon.test.ts,
// kontakt.test.ts, reminder.test.ts) — spreading this instead of passing
// testOverride directly keeps that shape exactly what it always was for
// every one of those callers, and only adds a real trailing argument when
// /api/admin/mails/testversand actually supplies one.
function testOverrideArgs(testOverride: TestOverride | undefined): [] | [TestOverride] {
  return testOverride ? [testOverride] : [];
}

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
// `parts` exists only for /api/admin/mails/testversand: it needs the
// notification (with a real rendered PDF, and either variant of the CV
// attachment) and the confirmation counted and shown as separate items,
// where a real submission always wants both together. Omitted (the default
// for every real caller — the two call sites in app/api/), both still run,
// unchanged from before this parameter existed.
export type DispatchApplicationMailsOptions = {
  parts?: { notification?: boolean; confirmation?: boolean };
  testOverride?: TestOverride;
};

export async function dispatchApplicationMails(
  application: Application,
  options?: DispatchApplicationMailsOptions,
): Promise<void> {
  const parts = options?.parts ?? { notification: true, confirmation: true };
  const testOverride = options?.testOverride;

  if (parts.notification) {
    const pdfBuffer = await renderToBuffer(ApplicationPdfDocument({ application }));

    // Best-effort, deliberately not allowed to throw: the application PDF
    // must reach the board's inbox regardless of whether the CV can be
    // attached alongside it (docs/engineering.md — "die Bewerbung darf nie
    // am Mailversand scheitern"). A missing cvPathname (no upload, or the
    // board already cleared it via "CV jetzt löschen"), a blob that has
    // since expired past retain_until, or any fetch failure all land here the
    // same way: cvAttachment stays null, and sendApplicationNotification's
    // own text tells the board where to find it instead.
    let cvAttachment: { filename: string; content: Buffer } | null = null;
    if (application.cvPathname) {
      try {
        const cv = await fetchCvBlobBuffer(application.cvPathname);
        if (cv) cvAttachment = { filename: `lebenslauf-${application.id}.pdf`, content: cv.buffer };
      } catch (error) {
        console.error("Failed to attach the CV to the application notification mail", error);
      }
    }

    await sendApplicationNotification(application, pdfBuffer, cvAttachment, ...testOverrideArgs(testOverride));
  }

  if (parts.confirmation) {
    const t = await getTranslations({
      locale: application.locale,
      namespace: "Mail.applicationConfirmation",
    });
    await sendApplicationConfirmation(
      {
        email: application.email,
        firstName: application.firstName,
        subject: t("subject"),
        text: t("body", { firstName: application.firstName }),
      },
      ...testOverrideArgs(testOverride),
    );
  }
}

// Same `parts` reasoning as dispatchApplicationMails above.
export type DispatchIdeathonSignupMailsOptions = {
  parts?: { notification?: boolean; confirmation?: boolean };
  testOverride?: TestOverride;
};

export async function dispatchIdeathonSignupMails(
  signup: IdeathonSignup,
  options?: DispatchIdeathonSignupMailsOptions,
): Promise<void> {
  const parts = options?.parts ?? { notification: true, confirmation: true };
  const testOverride = options?.testOverride;

  if (parts.notification) {
    await sendIdeathonSignupNotification(signup, ...testOverrideArgs(testOverride));
  }

  if (parts.confirmation) {
    const t = await getTranslations({ locale: signup.locale, namespace: "Mail.ideathonSignupConfirmation" });
    await sendIdeathonSignupConfirmation(
      {
        email: signup.email,
        firstName: signup.firstName,
        subject: t("subject"),
        text: t("body", { firstName: signup.firstName }),
      },
      ...testOverrideArgs(testOverride),
    );
  }
}

export async function dispatchContactNotification(
  message: ContactMessage,
  testOverride?: TestOverride,
): Promise<void> {
  const t = await getTranslations({ locale: message.locale, namespace: "Mail.contactNotification" });
  await sendContactMessageNotification(
    {
      name: message.name,
      email: message.email,
      subject: t("subject", { name: message.name }),
      text: `${message.name} (${message.email}) schreibt${message.subject ? ` zum Thema „${message.subject}“` : ""}:\n\n${message.message}`,
    },
    ...testOverrideArgs(testOverride),
  );
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
export async function dispatchReminderConfirmation(
  signup: ReminderConfirmationTarget,
  testOverride?: TestOverride,
): Promise<void> {
  const t = await getTranslations({ locale: signup.locale, namespace: "Mail.reminderConfirmation" });
  const base = siteUrl();
  const unsubscribeUrl = `${base}/api/reminder/abmelden?token=${signup.unsubscribeToken}`;
  await sendReminderConfirmationEmail(
    {
      email: signup.email,
      subject: t("subject"),
      text: t("body", {
        confirmUrl: `${base}/api/reminder/bestaetigen?token=${signup.confirmToken}`,
        unsubscribeUrl,
      }),
      unsubscribeUrl,
    },
    ...testOverrideArgs(testOverride),
  );
}

// Sent from /api/reminder when the submitted address has already confirmed
// — the UI response stays the same neutral "check your inbox" success
// either way (no email-enumeration leak: see that route's own comment), but
// the person still learns what actually happened, rather than the address
// silently receiving nothing. Reuses the row's existing, never-rotated
// unsubscribe token, same as dispatchReminderConfirmation's own comment on
// why a resend must never reissue tokens.
export type ReminderAlreadyRegisteredTarget = {
  email: string;
  locale: Locale;
  unsubscribeToken: string;
};

export async function dispatchReminderAlreadyRegistered(
  target: ReminderAlreadyRegisteredTarget,
  testOverride?: TestOverride,
): Promise<void> {
  const t = await getTranslations({ locale: target.locale, namespace: "Mail.reminderAlreadyRegistered" });
  const base = siteUrl();
  const unsubscribeUrl = `${base}/api/reminder/abmelden?token=${target.unsubscribeToken}`;
  await sendReminderAlreadyRegisteredEmail(
    {
      email: target.email,
      subject: t("subject"),
      text: t("body", { unsubscribeUrl }),
      unsubscribeUrl,
    },
    ...testOverrideArgs(testOverride),
  );
}

// The "an application window just opened" mail, sent once per (signup,
// window) — reminderWindowMail.ts owns the once-only guarantee (the
// database's unique constraint), this only composes the mail itself.
// Takes the fields the caller already has in hand from
// findConfirmedReminderSignups() plus the window being announced, not a
// whole row — same reasoning as ReminderConfirmationTarget above.
export type ReminderWindowOpenTarget = {
  email: string;
  locale: Locale;
  unsubscribeToken: string;
  semester: string;
  windowEndsAt: string;
};

export async function dispatchReminderWindowOpen(
  target: ReminderWindowOpenTarget,
  testOverride?: TestOverride,
): Promise<void> {
  const t = await getTranslations({ locale: target.locale, namespace: "Mail.reminderWindowOpen" });
  const base = siteUrl();
  const unsubscribeUrl = `${base}/api/reminder/abmelden?token=${target.unsubscribeToken}`;
  const endsAt = formatSiteDateTime(target.windowEndsAt, target.locale, { dateStyle: "long" });

  await sendReminderWindowOpenEmail(
    {
      email: target.email,
      subject: t("subject"),
      text: t("body", {
        applyUrl: `${base}${localizedPath("/mitmachen", target.locale)}`,
        endsAt,
        unsubscribeUrl,
      }),
      unsubscribeUrl,
    },
    ...testOverrideArgs(testOverride),
  );
}

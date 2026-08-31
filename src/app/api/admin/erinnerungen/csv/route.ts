import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { listReminderSignups } from "@/lib/db";
import { csvDocument } from "@/lib/csv";
import { reminderState } from "@/lib/adminReminders";
import { siteDateTimeFormatter } from "@/lib/formatSiteDateTime";

const CSV_COLUMNS = ["E-Mail", "Status", "Eingetragen am", "Bestätigt am", "Abgemeldet am", "Mailstatus"];

const STATE_LABEL: Record<string, string> = {
  confirmed: "bestätigt",
  unconfirmed: "unbestätigt",
  unsubscribed: "abgemeldet",
};

const MAIL_STATUS_LABEL: Record<string, string> = {
  pending: "ausstehend",
  sent: "gesendet",
  failed: "fehlgeschlagen",
};

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let signups;
  try {
    signups = await listReminderSignups();
  } catch (error) {
    console.error("Failed to read reminder signups for CSV export", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  // Pinned to Europe/Berlin — this route runs on Vercel's own UTC.
  const dateFormatter = siteDateTimeFormatter("de-DE", { dateStyle: "medium", timeStyle: "short" });
  const csv = csvDocument(
    CSV_COLUMNS,
    signups.map((signup) => [
      signup.email,
      STATE_LABEL[reminderState(signup)],
      dateFormatter.format(signup.createdAt),
      signup.confirmedAt ? dateFormatter.format(signup.confirmedAt) : "",
      signup.unsubscribedAt ? dateFormatter.format(signup.unsubscribedAt) : "",
      MAIL_STATUS_LABEL[signup.mailStatus] ?? signup.mailStatus,
    ]),
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      // No tokens in this export (see listReminderSignups): a file that
      // gets forwarded around must not carry live confirm/unsubscribe
      // links for other people's addresses.
      "Content-Disposition": 'attachment; filename="erinnerungsliste.csv"',
    },
  });
}

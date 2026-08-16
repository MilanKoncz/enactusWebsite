import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionCookieValue } from "@/lib/adminAuth";
import { listApplicationsBySemester } from "@/lib/db";

const CSV_COLUMNS = ["Name", "E-Mail", "Studiengang", "Eingangsdatum", "Mailstatus"];

// UTF-8 BOM first, per the brief — without it Excel guesses the system
// codepage and mangles every umlaut in a name or Studiengang.
const UTF8_BOM = "﻿";

function csvCell(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return /[",\n]/.test(value) ? `"${escaped}"` : escaped;
}

function csvRow(cells: string[]): string {
  return cells.map(csvCell).join(",") + "\r\n";
}

const MAIL_STATUS_LABEL: Record<string, string> = {
  pending: "ausstehend",
  sent: "gesendet",
  failed: "fehlgeschlagen",
};

export async function GET(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifySessionCookieValue(session)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const semester = request.nextUrl.searchParams.get("semester");
  if (!semester) {
    return NextResponse.json({ ok: false, error: "missing_semester" }, { status: 400 });
  }

  const applications = await listApplicationsBySemester(semester);
  const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

  let csv = UTF8_BOM + csvRow(CSV_COLUMNS);
  for (const application of applications) {
    csv += csvRow([
      `${application.firstName} ${application.lastName}`,
      application.email,
      application.studyProgram,
      dateFormatter.format(application.createdAt),
      MAIL_STATUS_LABEL[application.mailStatus] ?? application.mailStatus,
    ]);
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bewerbungen-${semester}.csv"`,
    },
  });
}

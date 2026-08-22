import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { listApplicationsBySemester } from "@/lib/db";
import { csvDocument } from "@/lib/csv";
import { filenameSegment } from "@/lib/filenameSegment";

// Wunschbereich is how the board actually sorts applications onto
// projects, not an incidental field — it belongs in the export the same
// way Studiengang does. Multiple selections join with "; ", not the CSV
// delimiter (","): csvCell (lib/csv.ts) already quotes a comma-containing
// cell safely for any CSV-aware tool, but "; " also reads cleanly for
// someone who pastes the raw text somewhere that isn't.
const CSV_COLUMNS = ["Name", "E-Mail", "Studiengang", "Wunschbereich", "Eingangsdatum", "Mailstatus"];

const MAIL_STATUS_LABEL: Record<string, string> = {
  pending: "ausstehend",
  sent: "gesendet",
  failed: "fehlgeschlagen",
};

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const semester = request.nextUrl.searchParams.get("semester");
  if (!semester) {
    return NextResponse.json({ ok: false, error: "missing_semester" }, { status: 400 });
  }

  // Wrapped, unlike before: a Neon outage here used to surface as an
  // unhandled 500 with no log line, which is the one failure mode the
  // board would have to guess at.
  let applications;
  try {
    applications = await listApplicationsBySemester(semester);
  } catch (error) {
    console.error("Failed to read applications for CSV export", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });
  const csv = csvDocument(
    CSV_COLUMNS,
    applications.map((application) => [
      `${application.firstName} ${application.lastName}`,
      application.email,
      application.studyProgram,
      application.desiredAreas.join("; "),
      dateFormatter.format(application.createdAt),
      MAIL_STATUS_LABEL[application.mailStatus] ?? application.mailStatus,
    ]),
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bewerbungen-${filenameSegment(semester)}.csv"`,
    },
  });
}

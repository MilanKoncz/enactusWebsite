import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { listApplicationsBySemester, type ApplicationSummary } from "@/lib/db";
import { csvDocument } from "@/lib/csv";
import { filenameSegment } from "@/lib/filenameSegment";
import { siteDateTimeFormatter } from "@/lib/formatSiteDateTime";

// Wunschbereich is how the board actually sorts applications onto
// projects, not an incidental field — it belongs in the export the same
// way Studiengang does. Fachsemester, Verfügbarkeit, and Skills were added
// once the board pointed out this export is also how they filter and sort
// candidates, not just how they read the list. Lebenslauf is ja/nein only
// — the blob URL never appears in the export, same rule as everywhere
// else it could leak (see lib/cvBlob.ts's own comment).
const CSV_COLUMNS = [
  "Name",
  "E-Mail",
  "Studiengang",
  "Fachsemester",
  "Verfügbarkeit",
  "Wunschbereiche",
  "Ressorts",
  "Skills",
  "Lebenslauf",
  "Eingangsdatum",
  "Mailstatus",
];

// Multiple choices join with " | ", each with its priority and reason —
// csvCell (lib/csv.ts) already quotes a comma-containing cell safely for
// any CSV-aware tool, but a plain, readable separator also matters for
// someone who pastes the raw text somewhere that isn't. Falls back to the
// legacy desiredAreas array for a pre-migration row that has no
// application_area_choices (migrations/0017 added no backfill).
function formatAreaChoices(application: ApplicationSummary): string {
  if (application.areaChoices.length > 0) {
    return application.areaChoices
      .map((choice) => `${choice.priority}. ${choice.areaLabel} — ${choice.reason}`)
      .join(" | ");
  }
  if (application.desiredAreas && application.desiredAreas.length > 0) {
    return `${application.desiredAreas.join("; ")} (ohne Priorisierung)`;
  }
  return "";
}

// A separate column from Wunschbereiche, never merged into it — a Ressort
// carries no priority and no reason, so joining it into the same cell would
// misrepresent it as another ranked choice. Empty for both NULL
// (pre-migration) and an empty array (asked, nothing chosen).
function formatDepartments(application: ApplicationSummary): string {
  return application.departments && application.departments.length > 0
    ? application.departments.join("; ")
    : "";
}

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

  // Pinned to Europe/Berlin — this route runs on Vercel's own UTC.
  const dateFormatter = siteDateTimeFormatter("de-DE", { dateStyle: "medium", timeStyle: "short" });
  const csv = csvDocument(
    CSV_COLUMNS,
    applications.map((application) => [
      `${application.firstName} ${application.lastName}`,
      application.email,
      application.studyProgram,
      String(application.semester),
      `${application.availabilityHours} Std./Woche`,
      formatAreaChoices(application),
      formatDepartments(application),
      application.languagesSkills ?? "",
      application.cvPathname ? "ja" : "nein",
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

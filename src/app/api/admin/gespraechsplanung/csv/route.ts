import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticatedRequest } from "@/lib/adminSession";
import { listApplicationsBySemester, listRecruitingWindows } from "@/lib/db";
import { generateInterviewSlots } from "@/lib/interviewSlots";
import { buildInterviewAvailabilityMatrix } from "@/lib/interviewAvailabilityMatrix";
import { csvDocument } from "@/lib/csv";
import { filenameSegment } from "@/lib/filenameSegment";

// Mirrors /admin/gespraechsplanung's own on-screen matrix exactly — same
// buildInterviewAvailabilityMatrix call, same column set (configured slots
// first, any orphaned value an applicant chose under a since-changed
// configuration appended after) — so a board member cross-checking the
// spreadsheet against the page never finds the two disagreeing.
export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const semester = request.nextUrl.searchParams.get("semester");
  if (!semester) {
    return NextResponse.json({ ok: false, error: "missing_semester" }, { status: 400 });
  }

  let applications;
  let windows;
  try {
    [applications, windows] = await Promise.all([listApplicationsBySemester(semester), listRecruitingWindows()]);
  } catch (error) {
    console.error("Failed to read applications for interview-availability CSV export", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const window = windows.find((candidate) => candidate.semester === semester);
  const configuredSlots = window
    ? generateInterviewSlots({
        days: window.interviewDays,
        startTime: window.interviewStartTime,
        endTime: window.interviewEndTime,
        slotMinutes: window.interviewSlotMinutes,
      })
    : [];

  const matrix = buildInterviewAvailabilityMatrix(
    configuredSlots,
    applications.map((application) => ({
      id: application.id,
      name: `${application.firstName} ${application.lastName}`,
      interviewSlots: application.interviewSlots,
    })),
  );

  const columnHeader = (column: (typeof matrix.columns)[number]) => {
    const [, month, day] = column.day.split("-");
    return `${day}.${month}. ${column.startTime}${column.configured ? "" : " (entfallen)"}`;
  };

  const columns = ["Name", "Antwort", ...matrix.columns.map(columnHeader), "Summe"];

  const rows = matrix.rows.map((row) => {
    const answer = !row.hasAnswer ? "keine Angabe" : row.selected.length === 0 ? "nichts gewählt" : "ja";
    const cells = matrix.columns.map((column) => (row.selected.includes(column.value) ? "x" : ""));
    return [row.name, answer, ...cells, row.hasAnswer ? String(row.selected.length) : ""];
  });
  // A summary row, same convention as the totals row in the on-screen
  // matrix — how many applicants can make each slot, at a glance, without
  // opening a spreadsheet formula.
  rows.push(["Verfügbar", "", ...matrix.columnTotals.map(String), ""]);

  const csv = csvDocument(columns, rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gespraechsplanung-${filenameSegment(semester)}.csv"`,
    },
  });
}

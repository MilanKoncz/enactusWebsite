import type { InterviewSlot } from "@/lib/interviewSlots";

/**
 * Turns the recruiting window's configured slots and a semester's
 * applications into the shape /admin/gespraechsplanung's matrix (and its
 * CSV export) both render — one place this reshaping happens, so the two
 * can't quietly drift into different column sets.
 *
 * Columns are the *union* of the currently configured slots and whatever
 * values actually appear on an application: a board that reconfigures the
 * interview days after applications have already come in must not silently
 * lose or misattribute an answer given under the previous configuration.
 * Orphaned columns (present only because some application chose them, no
 * longer part of the live grid) sort after every configured one and carry
 * `configured: false`, so the matrix can mark them instead of presenting
 * them as still bookable.
 */

export type MatrixColumn = {
  value: string;
  day: string;
  startTime: string;
  configured: boolean;
};

export type MatrixRow = {
  id: string;
  name: string;
  /** null when the application predates this field, or belongs to a window
      that had no interview grid at submission time — distinct from an
      empty array (asked, nothing chosen). Mirrors applications.interview_slots's
      own NULL-vs-empty rule (migrations/0023). */
  hasAnswer: boolean;
  selected: string[];
};

export type InterviewAvailabilityMatrix = {
  columns: MatrixColumn[];
  rows: MatrixRow[];
  /** How many applicants selected each column, in the same order as `columns`. */
  columnTotals: number[];
};

function dayAndTimeFromIso(value: string): { day: string; startTime: string } {
  const date = new Date(value);
  // UTC on purpose, not SITE_TIMEZONE: an orphaned value is whatever ISO
  // instant an applicant's stored row happens to hold, and this function
  // has no recruiting window to ask for the zone it was generated in.
  // Every value this project ever writes for a slot is itself derived from
  // wallClockToInstant against Europe/Berlin, so formatting in that same
  // zone here would double-apply the same offset a stored, already-instant
  // value doesn't need re-interpreted — UTC-based field extraction on an
  // ISO string this codebase itself produced is exact, not a display choice.
  return {
    day: date.toISOString().slice(0, 10),
    startTime: date.toISOString().slice(11, 16),
  };
}

export function buildInterviewAvailabilityMatrix(
  configuredSlots: InterviewSlot[],
  applications: Array<{ id: string; name: string; interviewSlots: string[] | null }>,
): InterviewAvailabilityMatrix {
  const configuredValues = new Set(configuredSlots.map((slot) => slot.value));
  const orphanedValues = new Set<string>();
  for (const application of applications) {
    for (const value of application.interviewSlots ?? []) {
      if (!configuredValues.has(value)) orphanedValues.add(value);
    }
  }

  const columns: MatrixColumn[] = [
    ...configuredSlots.map((slot) => ({ value: slot.value, day: slot.day, startTime: slot.startTime, configured: true })),
    ...Array.from(orphanedValues)
      .sort()
      .map((value) => ({ value, ...dayAndTimeFromIso(value), configured: false })),
  ];

  const rows: MatrixRow[] = applications.map((application) => ({
    id: application.id,
    name: application.name,
    hasAnswer: application.interviewSlots !== null,
    selected: application.interviewSlots ?? [],
  }));

  const columnTotals = columns.map(
    (column) => rows.filter((row) => row.selected.includes(column.value)).length,
  );

  return { columns, rows, columnTotals };
}

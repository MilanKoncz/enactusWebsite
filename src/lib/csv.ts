/**
 * CSV serialisation for the admin area's exports. Extracted from
 * /api/admin/bewerbungen/csv now that the reminder list needs the same
 * thing — one escaping rule and one BOM decision, not two that drift.
 *
 * The BOM is load-bearing: without it Excel guesses the system codepage
 * and mangles every umlaut in a name or a Studiengang. Tests assert it at
 * the byte level, because `response.text()` strips a leading BOM by spec.
 *
 * Known gap, tracked in REVIEW.md (finding 10) and deliberately not
 * changed here: a cell beginning with `=`, `+`, `-`, or `@` is written
 * as-is, so Excel evaluates it as a formula. It needs an admin login and a
 * planted application to exploit, and fixing it changes what every existing
 * export looks like — a separate decision, not a side effect of extracting
 * this file.
 */

export const UTF8_BOM = "﻿";

export function csvCell(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return /[",\n]/.test(value) ? `"${escaped}"` : escaped;
}

export function csvRow(cells: string[]): string {
  return cells.map(csvCell).join(",") + "\r\n";
}

export function csvDocument(columns: string[], rows: string[][]): string {
  return UTF8_BOM + csvRow(columns) + rows.map(csvRow).join("");
}

// Only ever interpolated into a Content-Disposition filename, so anything
// outside this set is dropped rather than escaped — a semester label is
// `HWS26`-shaped by definition (content/recruiting.ts's own regex), and a
// filename is not the place to discover otherwise.
export function csvFilenameSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9-]/g, "");
}

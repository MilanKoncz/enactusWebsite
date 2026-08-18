/**
 * Sanitizes a value for safe interpolation into a `Content-Disposition`
 * filename. Originally lived in lib/csv.ts as `csvFilenameSegment`, moved
 * here once the calendar's .ics download (lib/ics.ts) needed the exact
 * same rule for an event title — the sanitisation itself was never
 * CSV-specific, only its first caller was.
 *
 * Only ever interpolated into a filename, so anything outside this set is
 * dropped rather than escaped — a semester label is `HWS26`-shaped by
 * definition (content/recruiting.ts's own regex), and a filename is not
 * the place to discover otherwise for an event title either.
 */
export function filenameSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9-]/g, "");
}

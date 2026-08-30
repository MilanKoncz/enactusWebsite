import type { RecruitingWindow } from "@/content/recruiting";
import { windowContaining } from "@/lib/recruitingStatus";

/**
 * The recruiting-cycle label stored on every application (applications.
 * recruiting_semester — see migrations/0002_add_recruiting_semester.sql).
 * Not the same column as applications.semester, which is the applicant's
 * own semester of study.
 *
 * Primary rule: the label of whichever window (lib/recruitingWindows.ts)
 * the submission falls into. A submission can land outside every known
 * window (a late arrival right after one closes, or before the board has
 * entered the next one) — for that case only, the label is derived from the
 * month, per the board's own fallback rule: März–September is HWS of the
 * current year, Oktober–Februar is FSS of the following year (Oct/Nov/Dec of
 * year Y and Jan/Feb of year Y+1 are one continuous span, so both resolve to
 * FSS(Y+1)). Never invented beyond that stated rule.
 */
function twoDigitYear(year: number): string {
  return String(year % 100).padStart(2, "0");
}

export function deriveSemesterLabel(date: Date): string {
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();

  if (month >= 3 && month <= 9) return `HWS${twoDigitYear(year)}`;
  if (month >= 10) return `FSS${twoDigitYear(year + 1)}`;
  return `FSS${twoDigitYear(year)}`;
}

export function resolveApplicationSemester(now: Date, windows: RecruitingWindow[]): string {
  const window = windowContaining(now.getTime(), windows);
  return window ? window.semester : deriveSemesterLabel(now);
}

import { wallClockToInstant } from "./recruitingTime";

/**
 * Turns a recruiting window's interview configuration (days, a daily time
 * range, a slot length) into the concrete slots an applicant can pick from.
 * Pure and DB/Next-free on purpose — both /api/gespraechsslots (public,
 * read-only) and /api/bewerbung (validates a submission against the exact
 * same set) call this against whatever grid lib/recruitingWindows.ts handed
 * them, so the two can never compute a different answer for the same
 * configuration.
 */

// One board-typed cap, not a booking limit: this is the ceiling on how many
// days a single window's admin form accepts, read by both
// recruitingWindowFormSchema.ts and its own field hint.
export const MAX_INTERVIEW_DAYS = 14;
export const INTERVIEW_SLOT_MINUTES_MIN = 5;
export const INTERVIEW_SLOT_MINUTES_MAX = 480;
// A payload ceiling on the applicant's own array, not a visible maximum —
// the real rule is "must be one of the offered slots", enforced in
// /api/bewerbung. Comfortably above 18 (this window's actual slot count)
// so a future window with more days never has to touch this number.
export const MAX_INTERVIEW_SLOTS = 200;

// What an <input type="time"> control produces and what
// generateInterviewSlots below expects back — "HH:MM", optionally with
// seconds when it comes straight off a database `time` column.
export const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export type InterviewSlotGrid = {
  /** "YYYY-MM-DD", any order — generateInterviewSlots sorts its own copy. */
  days: string[];
  startTime: string;
  endTime: string;
  slotMinutes: number;
};

export type InterviewSlot = {
  /** The slot's start instant, ISO 8601 UTC — the one value every consumer
      compares by by exact string equality (all three sides — the offered
      set, the applicant's chosen values, and what gets stored — are built
      by this same function, so nothing here ever needs a Date-vs-Date
      comparison to notice a match). */
  value: string;
  day: string;
  startTime: string;
  endTime: string;
};

function minutesSinceMidnight(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * One entry per day times however many whole slotMinutes-long slots fit
 * between startTime and endTime — a remainder that doesn't fill a whole
 * slot is dropped, never padded into a short final one. Days are sorted
 * before use rather than trusted from the caller: a Postgres date[] column
 * makes no ordering guarantee, and "YYYY-MM-DD" strings sort chronologically
 * as plain strings, so a plain .sort() is exact.
 *
 * No filtering by "is this slot still in the future" — that's the
 * display-time concern of whichever client has a real clock (see
 * MitmachenApplication.tsx), not this function's. /api/bewerbung
 * deliberately validates a submission against this full, unfiltered set:
 * a slot ticking into the past during the minutes someone spends filling
 * out the form is still a submission worth keeping, and checking recency
 * server-side would just invite a race at the slot boundary for no benefit.
 */
export function generateInterviewSlots(grid: InterviewSlotGrid): InterviewSlot[] {
  const startMinutes = minutesSinceMidnight(grid.startTime);
  const endMinutes = minutesSinceMidnight(grid.endTime);
  const days = [...grid.days].sort();

  const slots: InterviewSlot[] = [];
  for (const day of days) {
    for (let slotStart = startMinutes; slotStart + grid.slotMinutes <= endMinutes; slotStart += grid.slotMinutes) {
      const startTime = formatMinutes(slotStart);
      const endTime = formatMinutes(slotStart + grid.slotMinutes);
      slots.push({
        value: wallClockToInstant(`${day}T${startTime}`).toISOString(),
        day,
        startTime,
        endTime,
      });
    }
  }
  return slots;
}

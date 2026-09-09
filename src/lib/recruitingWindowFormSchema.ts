import { z } from "zod";
import { SEMESTER_FORMAT } from "@/content/recruiting";
import { WALL_CLOCK_PATTERN, wallClockToInstant } from "@/lib/recruitingTime";
import {
  generateInterviewSlots,
  MAX_INTERVIEW_DAYS,
  INTERVIEW_SLOT_MINUTES_MIN,
  INTERVIEW_SLOT_MINUTES_MAX,
  TIME_OF_DAY_PATTERN,
} from "@/lib/interviewSlots";

/**
 * What /admin/bewerbungsfenster's form submits, validated identically on
 * the client and in the route — same arrangement as the three public forms.
 *
 * Dates arrive as `datetime-local` wall-clock strings and are compared
 * *after* conversion to instants (lib/recruitingTime.ts), not as strings:
 * two wall clocks either side of a DST change don't order the same way as
 * text as they do in time, and "end after start" has to mean the latter.
 *
 * Overlap is deliberately not checked here. It needs the other rows, which
 * a schema has no access to — the route asks the database
 * (findOverlappingRecruitingWindows) once this shape has passed.
 *
 * The four interview_* fields all default to "no days configured yet, a
 * standard 10-19/60 range" so a board member creating a brand-new window
 * doesn't have to fill in the interview section before the semester/
 * start/end fields can be saved at all — the interview days are typically
 * entered once applications start coming in, not at window creation.
 */
export const recruitingWindowFormSchema = z
  .object({
    semester: z.string().trim().regex(SEMESTER_FORMAT, "must look like HWS26 or FSS27"),
    start: z.string().regex(WALL_CLOCK_PATTERN, "must be a date and time"),
    end: z.string().regex(WALL_CLOCK_PATTERN, "must be a date and time"),
    interviewDays: z.array(z.iso.date()).max(MAX_INTERVIEW_DAYS).default([]),
    interviewStartTime: z.string().regex(TIME_OF_DAY_PATTERN, "must be a time").default("10:00"),
    interviewEndTime: z.string().regex(TIME_OF_DAY_PATTERN, "must be a time").default("19:00"),
    interviewSlotMinutes: z.coerce
      .number()
      .int()
      .min(INTERVIEW_SLOT_MINUTES_MIN)
      .max(INTERVIEW_SLOT_MINUTES_MAX)
      .default(60),
  })
  .refine((window) => wallClockToInstant(window.end) > wallClockToInstant(window.start), {
    message: "end must be after start",
    path: ["end"],
  })
  // Plain string comparison, not wallClockToInstant: these are a
  // wall-clock range repeated on every configured day, not two instants —
  // "10:00" < "19:00" orders correctly as text precisely because both are
  // always zero-padded HH:MM.
  .refine((window) => window.interviewEndTime > window.interviewStartTime, {
    message: "interview end must be after interview start",
    path: ["interviewEndTime"],
  })
  .refine((window) => new Set(window.interviewDays).size === window.interviewDays.length, {
    message: "duplicate interview day",
    path: ["interviewDays"],
  })
  .refine(
    (window) =>
      window.interviewDays.length === 0 ||
      generateInterviewSlots({
        days: window.interviewDays,
        startTime: window.interviewStartTime,
        endTime: window.interviewEndTime,
        slotMinutes: window.interviewSlotMinutes,
      }).length > 0,
    { message: "no whole slot fits in the interview time range", path: ["interviewSlotMinutes"] },
  );

export type RecruitingWindowFormValues = z.infer<typeof recruitingWindowFormSchema>;

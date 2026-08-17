import { z } from "zod";
import { SEMESTER_FORMAT } from "@/content/recruiting";
import { WALL_CLOCK_PATTERN, wallClockToInstant } from "@/lib/recruitingTime";

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
 */
export const recruitingWindowFormSchema = z
  .object({
    semester: z.string().trim().regex(SEMESTER_FORMAT, "must look like HWS26 or FSS27"),
    start: z.string().regex(WALL_CLOCK_PATTERN, "must be a date and time"),
    end: z.string().regex(WALL_CLOCK_PATTERN, "must be a date and time"),
  })
  .refine((window) => wallClockToInstant(window.end) > wallClockToInstant(window.start), {
    message: "end must be after start",
    path: ["end"],
  });

export type RecruitingWindowFormValues = z.infer<typeof recruitingWindowFormSchema>;

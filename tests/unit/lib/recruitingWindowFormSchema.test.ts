import { describe, expect, it } from "vitest";
import { recruitingWindowFormSchema } from "@/lib/recruitingWindowFormSchema";

function validDraft(overrides: Record<string, unknown> = {}) {
  return {
    semester: "HWS26",
    start: "2026-09-01T00:00",
    end: "2026-09-13T23:59",
    ...overrides,
  };
}

describe("recruitingWindowFormSchema — interview grid defaults", () => {
  it("defaults to no interview days and a standard 10-19/60 range when omitted", () => {
    const result = recruitingWindowFormSchema.parse(validDraft());
    expect(result.interviewDays).toEqual([]);
    expect(result.interviewStartTime).toBe("10:00");
    expect(result.interviewEndTime).toBe("19:00");
    expect(result.interviewSlotMinutes).toBe(60);
  });

  it("accepts an explicit interview grid", () => {
    const result = recruitingWindowFormSchema.safeParse(
      validDraft({
        interviewDays: ["2026-09-15", "2026-09-16"],
        interviewStartTime: "10:00",
        interviewEndTime: "19:00",
        interviewSlotMinutes: 60,
      }),
    );
    expect(result.success).toBe(true);
  });
});

describe("recruitingWindowFormSchema — interview grid validation", () => {
  it("rejects an interview end time not after the start time", () => {
    const result = recruitingWindowFormSchema.safeParse(
      validDraft({ interviewStartTime: "19:00", interviewEndTime: "10:00" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a duplicate interview day", () => {
    const result = recruitingWindowFormSchema.safeParse(
      validDraft({ interviewDays: ["2026-09-15", "2026-09-15"] }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects more than MAX_INTERVIEW_DAYS days", async () => {
    const { MAX_INTERVIEW_DAYS } = await import("@/lib/interviewSlots");
    const days = Array.from({ length: MAX_INTERVIEW_DAYS + 1 }, (_, index) =>
      new Date(Date.UTC(2026, 8, 1 + index)).toISOString().slice(0, 10),
    );
    const result = recruitingWindowFormSchema.safeParse(validDraft({ interviewDays: days }));
    expect(result.success).toBe(false);
  });

  it("rejects a slot length no whole slot fits into the time range", () => {
    const result = recruitingWindowFormSchema.safeParse(
      validDraft({
        interviewDays: ["2026-09-15"],
        interviewStartTime: "10:00",
        interviewEndTime: "10:30",
        interviewSlotMinutes: 60,
      }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts a slot-range mismatch when there are no interview days configured yet", () => {
    // The "no whole slot fits" rule is only meaningful once there's
    // actually a day to generate slots for.
    const result = recruitingWindowFormSchema.safeParse(
      validDraft({ interviewDays: [], interviewStartTime: "10:00", interviewEndTime: "10:30", interviewSlotMinutes: 60 }),
    );
    expect(result.success).toBe(true);
  });
});

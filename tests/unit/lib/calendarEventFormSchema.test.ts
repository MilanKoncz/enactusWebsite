import { describe, expect, it } from "vitest";
import { calendarEventFormSchema } from "@/lib/calendarEventFormSchema";

const BASE = {
  title: "Kick-off",
  category: "bewerbung" as const,
  startDate: "2026-09-08",
  tentative: false,
};

describe("calendarEventFormSchema", () => {
  it("accepts a minimal single-day draft", () => {
    expect(calendarEventFormSchema.safeParse(BASE).success).toBe(true);
  });

  it("treats empty optional fields as absent, not as validation failures", () => {
    const result = calendarEventFormSchema.safeParse({
      ...BASE,
      titleEn: "",
      endDate: "",
      startTime: "",
      endTime: "",
      location: "",
      description: "",
      descriptionEn: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.titleEn).toBeUndefined();
      expect(result.data.endDate).toBeUndefined();
    }
  });

  it("rejects an end date before the start date", () => {
    const result = calendarEventFormSchema.safeParse({
      ...BASE,
      startDate: "2026-09-16",
      endDate: "2026-09-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an end time with no start time", () => {
    const result = calendarEventFormSchema.safeParse({ ...BASE, endTime: "21:00" });
    expect(result.success).toBe(false);
  });

  it("rejects an end time before the start time on the same day", () => {
    const result = calendarEventFormSchema.safeParse({
      ...BASE,
      startTime: "18:00",
      endTime: "09:00",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an end time earlier in the clock than the start time when the event spans multiple days", () => {
    const result = calendarEventFormSchema.safeParse({
      ...BASE,
      endDate: "2026-09-09",
      startTime: "18:00",
      endTime: "09:00",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an end time after the start time on the same day", () => {
    const result = calendarEventFormSchema.safeParse({
      ...BASE,
      startTime: "16:00",
      endTime: "21:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a blank title", () => {
    expect(calendarEventFormSchema.safeParse({ ...BASE, title: "   " }).success).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(calendarEventFormSchema.safeParse({ ...BASE, category: "sponsoring" }).success).toBe(false);
  });
});

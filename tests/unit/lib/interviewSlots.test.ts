import { describe, expect, it } from "vitest";
import { generateInterviewSlots } from "@/lib/interviewSlots";

describe("generateInterviewSlots", () => {
  it("produces nine hourly slots per day for a 10-19 range", () => {
    const slots = generateInterviewSlots({
      days: ["2026-09-15", "2026-09-16"],
      startTime: "10:00",
      endTime: "19:00",
      slotMinutes: 60,
    });

    expect(slots).toHaveLength(18);
    expect(slots.filter((slot) => slot.day === "2026-09-15")).toHaveLength(9);
    expect(slots.filter((slot) => slot.day === "2026-09-16")).toHaveLength(9);
    expect(slots[0]).toMatchObject({ day: "2026-09-15", startTime: "10:00", endTime: "11:00" });
    // Berlin is CEST (+02:00) in September, so 10:00 local is 08:00 UTC.
    expect(slots[0].value).toBe("2026-09-15T08:00:00.000Z");
  });

  it("drops a remainder that doesn't fill a whole slot", () => {
    const slots = generateInterviewSlots({
      days: ["2026-09-15"],
      startTime: "10:00",
      endTime: "10:50",
      slotMinutes: 60,
    });
    expect(slots).toHaveLength(0);
  });

  it("supports a shorter slot length, e.g. 30 minutes", () => {
    const slots = generateInterviewSlots({
      days: ["2026-09-15"],
      startTime: "10:00",
      endTime: "11:00",
      slotMinutes: 30,
    });
    expect(slots.map((slot) => slot.startTime)).toEqual(["10:00", "10:30"]);
  });

  it("returns nothing for an empty day list", () => {
    expect(generateInterviewSlots({ days: [], startTime: "10:00", endTime: "19:00", slotMinutes: 60 })).toEqual([]);
  });

  it("sorts its own copy of the days regardless of input order", () => {
    const slots = generateInterviewSlots({
      days: ["2026-09-16", "2026-09-15"],
      startTime: "10:00",
      endTime: "11:00",
      slotMinutes: 60,
    });
    expect(slots.map((slot) => slot.day)).toEqual(["2026-09-15", "2026-09-16"]);
  });

  it("handles a winter date correctly (CET, +01:00)", () => {
    const slots = generateInterviewSlots({
      days: ["2027-01-15"],
      startTime: "10:00",
      endTime: "11:00",
      slotMinutes: 60,
    });
    expect(slots[0].value).toBe("2027-01-15T09:00:00.000Z");
  });
});

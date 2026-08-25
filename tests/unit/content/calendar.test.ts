import { describe, expect, it } from "vitest";
import { CALENDAR_CATEGORIES, calendarCategorySchema, calendarEventSchema } from "@/content/calendar";

const BASE_EVENT = {
  id: "0f2b8c3a-9d4e-4b1f-8a7c-2e5d6f7a8b9c",
  title: "Initiativenmarkt",
  titleEn: null,
  category: "bewerbung" as const,
  startDate: "2026-09-01",
  endDate: null,
  startTime: null,
  endTime: null,
  location: null,
  description: null,
  descriptionEn: null,
  tentative: false,
  internalLink: null,
};

describe("content/calendar", () => {
  it("keeps the seven categories in the documented, fixed order", () => {
    expect(CALENDAR_CATEGORIES).toEqual([
      "innolab",
      "projekte",
      "journeys",
      "wettkaempfe",
      "socials",
      "workshops",
      "bewerbung",
    ]);
  });

  it("accepts every documented category", () => {
    for (const category of CALENDAR_CATEGORIES) {
      expect(() => calendarCategorySchema.parse(category)).not.toThrow();
    }
  });

  it("rejects a category outside the fixed set", () => {
    expect(() => calendarCategorySchema.parse("sponsoring")).toThrow();
  });

  it("accepts a minimal single-day event", () => {
    expect(() => calendarEventSchema.parse(BASE_EVENT)).not.toThrow();
  });

  it("accepts a multi-day event where the end date is after the start date", () => {
    expect(() =>
      calendarEventSchema.parse({ ...BASE_EVENT, endDate: "2026-09-16" }),
    ).not.toThrow();
  });

  it("accepts an end date equal to the start date", () => {
    expect(() =>
      calendarEventSchema.parse({ ...BASE_EVENT, endDate: BASE_EVENT.startDate }),
    ).not.toThrow();
  });

  it("rejects an end date before the start date", () => {
    expect(() =>
      calendarEventSchema.parse({ ...BASE_EVENT, startDate: "2026-09-16", endDate: "2026-09-01" }),
    ).toThrow();
  });

  it("accepts HH:MM start and end times", () => {
    expect(() =>
      calendarEventSchema.parse({ ...BASE_EVENT, startTime: "16:00", endTime: "21:00" }),
    ).not.toThrow();
  });

  it("rejects a time that isn't HH:MM", () => {
    expect(() => calendarEventSchema.parse({ ...BASE_EVENT, startTime: "4pm" })).toThrow();
    expect(() => calendarEventSchema.parse({ ...BASE_EVENT, startTime: "16:00:00" })).toThrow();
  });

  it("accepts a blank title as invalid — must be non-empty", () => {
    expect(() => calendarEventSchema.parse({ ...BASE_EVENT, title: "" })).toThrow();
  });

  it("rejects a malformed date", () => {
    expect(() => calendarEventSchema.parse({ ...BASE_EVENT, startDate: "01.09.2026" })).toThrow();
  });

  it("accepts a null internal link", () => {
    expect(() => calendarEventSchema.parse({ ...BASE_EVENT, internalLink: null })).not.toThrow();
  });

  it("accepts an internal link starting with /", () => {
    expect(() => calendarEventSchema.parse({ ...BASE_EVENT, internalLink: "/ideathon" })).not.toThrow();
  });

  it("rejects an internal link that isn't a site-relative path", () => {
    expect(() => calendarEventSchema.parse({ ...BASE_EVENT, internalLink: "https://example.com" })).toThrow();
  });
});

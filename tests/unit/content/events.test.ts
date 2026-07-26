import { describe, expect, it } from "vitest";
import { events, eventSchema } from "@/content/events";

describe("content/events", () => {
  it("has four placeholder entries until the board provides a calendar", () => {
    expect(events.map((e) => e.slug)).toEqual(["event-1", "event-2", "event-3", "event-4"]);
  });

  it("derives the title message key from the event's slug", () => {
    for (const event of events) {
      expect(event.title).toBe(`Events.${event.slug}.title`);
    }
  });

  it("leaves date, location, and externalUrl null until confirmed", () => {
    for (const event of events) {
      expect(event.date).toBeNull();
      expect(event.location).toBeNull();
      expect(event.externalUrl).toBeNull();
    }
  });

  it("validates every exported event against the schema", () => {
    for (const event of events) {
      expect(() => eventSchema.parse(event)).not.toThrow();
    }
  });

  it("accepts a well-formed event", () => {
    expect(() =>
      eventSchema.parse({
        slug: "infoabend-2026",
        title: "Events.infoabend-2026.title",
        date: "2026-09-15",
        location: null,
        externalUrl: null,
      }),
    ).not.toThrow();
  });

  it("rejects an event with a malformed date or slug", () => {
    const base = { title: "Events.test.title", location: null, externalUrl: null };
    expect(() => eventSchema.parse({ ...base, slug: "Not A Slug", date: null })).toThrow();
    expect(() => eventSchema.parse({ ...base, slug: "test", date: "15.09.2026" })).toThrow();
  });
});

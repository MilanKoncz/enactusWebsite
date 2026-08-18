import { describe, expect, it } from "vitest";
import { egEventKeySchema, egEvents, egEventSchema } from "@/content/egEvents";

describe("content/egEvents", () => {
  it("has the four confirmed events in order", () => {
    expect(egEvents.map((e) => e.key)).toEqual(["nc", "esa", "oew", "twe"]);
    expect(egEvents.map((e) => e.order)).toEqual([1, 2, 3, 4]);
  });

  it("has a real photo for every event, rooted under /events", () => {
    for (const event of egEvents) {
      expect(event.image).toMatch(/^\/events\//);
    }
  });

  it("validates every exported event against the schema", () => {
    for (const event of egEvents) {
      expect(() => egEventSchema.parse(event)).not.toThrow();
    }
  });

  it("rejects an event with an unknown key", () => {
    expect(() => egEventSchema.parse({ key: "esa26", order: 1, image: "/events/x.jpg" })).toThrow();
  });

  it("rejects an image path that isn't rooted", () => {
    expect(() => egEventSchema.parse({ key: "nc", order: 1, image: "events/x.jpg" })).toThrow();
  });

  it("keeps the key enum in sync with the exported event list", () => {
    expect(egEventKeySchema.options).toEqual(egEvents.map((e) => e.key));
  });
});

import { describe, expect, it } from "vitest";
import { eventFormatKeySchema, eventFormats, eventFormatSchema } from "@/content/eventFormats";

describe("content/eventFormats", () => {
  it("has the four confirmed formats in order, gala instead of journeys", () => {
    expect(eventFormats.map((f) => f.key)).toEqual(["socials", "workshops", "teamweekend", "gala"]);
    expect(eventFormats.map((f) => f.order)).toEqual([1, 2, 3, 4]);
  });

  it("has a real photo for every format", () => {
    const byKey = Object.fromEntries(eventFormats.map((f) => [f.key, f.image]));
    expect(byKey.socials).toBe("/events/socials.webp");
    expect(byKey.workshops).toBe("/events/workshops.webp");
    expect(byKey.teamweekend).toBe("/events/teamweekend.webp");
    expect(byKey.gala).toBe("/events/gala.webp");
  });

  it("validates every exported format against the schema", () => {
    for (const format of eventFormats) {
      expect(() => eventFormatSchema.parse(format)).not.toThrow();
    }
  });

  it("rejects a format with an unknown key", () => {
    expect(() => eventFormatSchema.parse({ key: "journeys", order: 1, image: null })).toThrow();
  });

  it("keeps the key enum in sync with the exported format list", () => {
    expect(eventFormatKeySchema.options).toEqual(eventFormats.map((f) => f.key));
  });
});

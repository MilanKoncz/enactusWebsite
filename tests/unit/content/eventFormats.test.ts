import { describe, expect, it } from "vitest";
import { eventFormatKeySchema, eventFormats, eventFormatSchema } from "@/content/eventFormats";

describe("content/eventFormats", () => {
  it("has the four confirmed formats in order", () => {
    expect(eventFormats.map((f) => f.key)).toEqual(["socials", "workshops", "teamweekend", "journeys"]);
    expect(eventFormats.map((f) => f.order)).toEqual([1, 2, 3, 4]);
  });

  it("leaves image null until an asset exists", () => {
    for (const format of eventFormats) {
      expect(format.image).toBeNull();
    }
  });

  it("validates every exported format against the schema", () => {
    for (const format of eventFormats) {
      expect(() => eventFormatSchema.parse(format)).not.toThrow();
    }
  });

  it("rejects a format with an unknown key", () => {
    expect(() => eventFormatSchema.parse({ key: "not-a-format", order: 1, image: null })).toThrow();
  });

  it("keeps the key enum in sync with the exported format list", () => {
    expect(eventFormatKeySchema.options).toEqual(eventFormats.map((f) => f.key));
  });
});

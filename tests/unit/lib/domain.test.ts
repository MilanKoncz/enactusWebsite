import { describe, expect, it } from "vitest";
import { formatDomain } from "@/lib/domain";

describe("formatDomain", () => {
  it("returns the bare hostname", () => {
    expect(formatDomain("https://mealyo.de")).toBe("mealyo.de");
    expect(formatDomain("https://mealyo.de/some/path?query=1")).toBe("mealyo.de");
  });

  it("strips a leading www.", () => {
    expect(formatDomain("https://www.enactus-mannheim.com")).toBe("enactus-mannheim.com");
  });

  it("falls back to the raw string for a malformed URL", () => {
    expect(formatDomain("not a url")).toBe("not a url");
  });
});

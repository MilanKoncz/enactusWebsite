import { describe, expect, it } from "vitest";
import { localizedPath } from "@/lib/localizedPath";

describe("localizedPath", () => {
  it("returns the bare path for German, the default unprefixed locale", () => {
    expect(localizedPath("/mitmachen", "de")).toBe("/mitmachen");
    expect(localizedPath("/", "de")).toBe("/");
  });

  it("prefixes non-root paths with /en", () => {
    expect(localizedPath("/mitmachen", "en")).toBe("/en/mitmachen");
  });

  it("maps the root path to exactly /en, not /en/", () => {
    expect(localizedPath("/", "en")).toBe("/en");
  });

  it("translates the one route whose English slug differs from German", () => {
    expect(localizedPath("/termine", "de")).toBe("/termine");
    expect(localizedPath("/termine", "en")).toBe("/en/calendar");
  });
});

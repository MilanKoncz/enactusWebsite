import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { org } from "@/content/org";

describe("manifest", () => {
  const result = manifest();

  it("names the app from content/org.ts, not a hardcoded string", () => {
    expect(result.name).toBe(org.legalName);
    expect(result.short_name).toBe(org.shortName);
  });

  it("includes an any-purpose icon at 192 and 512, plus a maskable 512 for Android", () => {
    const byPurpose = (purpose: string) => result.icons?.filter((icon) => icon.purpose === purpose) ?? [];
    expect(byPurpose("any").map((icon) => icon.sizes)).toEqual(["192x192", "512x512"]);
    expect(byPurpose("maskable").map((icon) => icon.sizes)).toEqual(["512x512"]);
  });

  it("points every icon at a rooted public path", () => {
    for (const icon of result.icons ?? []) {
      expect(icon.src).toMatch(/^\/icons\//);
    }
  });

  it("uses the brand ink navy for both theme and background color", () => {
    expect(result.theme_color).toBe("#061031");
    expect(result.background_color).toBe("#061031");
  });
});

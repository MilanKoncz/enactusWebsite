import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

describe("robots", () => {
  it("allows crawling by default", () => {
    const result = robots();
    expect(result.rules).toMatchObject({ userAgent: "*", allow: "/" });
  });

  it("disallows /api/ and /styleguide in both locales", () => {
    const result = robots();
    const rules = result.rules as { disallow: string[] };
    expect(rules.disallow).toEqual(expect.arrayContaining(["/api/", "/styleguide", "/en/styleguide"]));
  });

  it("points at the generated sitemap", () => {
    const result = robots();
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});

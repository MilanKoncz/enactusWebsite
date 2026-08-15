import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { routes } from "@/content/navigation";
import { projects } from "@/content/projects";

describe("sitemap", () => {
  const entries = sitemap();

  it("lists every route-tree path in both locales", () => {
    const expectedPaths =
      Object.values(routes).length + 1 /* archive */ + projects.length /* one per slug */;
    expect(entries).toHaveLength(expectedPaths * 2);
  });

  it("never includes /styleguide — a design reference, not public content", () => {
    expect(entries.some((entry) => entry.url.includes("styleguide"))).toBe(false);
  });

  it("includes the German route unprefixed and the English route under /en", () => {
    expect(entries.some((entry) => entry.url.endsWith("/prozess"))).toBe(true);
    expect(entries.some((entry) => entry.url.endsWith("/en/prozess"))).toBe(true);
  });

  it("includes a page for every project archive slug", () => {
    for (const project of projects) {
      expect(entries.some((entry) => entry.url.endsWith(`/projekte/${project.slug}`))).toBe(true);
    }
  });

  it("declares both locales as alternates on every entry", () => {
    for (const entry of entries) {
      expect(entry.alternates?.languages).toHaveProperty("de");
      expect(entry.alternates?.languages).toHaveProperty("en");
    }
  });
});

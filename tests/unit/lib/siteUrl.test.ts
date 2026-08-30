import { afterEach, describe, expect, it, vi } from "vitest";

const ENV_KEYS = ["NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL"] as const;

async function importFresh() {
  vi.resetModules();
  return import("@/lib/siteUrl");
}

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

describe("siteUrl", () => {
  it("prefers an explicitly configured site URL", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    const { siteUrl } = await importFresh();
    expect(siteUrl()).toBe("https://example.com");
  });

  it("falls back to Vercel's own production URL when no site URL is set", async () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "my-project.vercel.app";
    const { siteUrl } = await importFresh();
    expect(siteUrl()).toBe("https://my-project.vercel.app");
  });

  it("falls back to localhost when neither is set, rather than guessing a domain", async () => {
    const { siteUrl } = await importFresh();
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  // The exact silent failure that put a localhost link into a real,
  // already-sent mail on 2026-08-30: NEXT_PUBLIC_SITE_URL was missing
  // locally and nothing said so until this warning was added.
  it("warns once per process when falling back to localhost", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { siteUrl } = await importFresh();

    siteUrl();
    siteUrl();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("NEXT_PUBLIC_SITE_URL is not set");
    warn.mockRestore();
  });

  it("never warns when a real site URL resolves", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { siteUrl } = await importFresh();

    siteUrl();

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

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
});

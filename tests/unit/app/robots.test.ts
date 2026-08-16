import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";

let mockHost: string | null = "enactus-mannheim.com";

// robots.ts reads the request's Host header via next/headers to decide
// whether this deployment may be indexed (productionDeployment.ts) — that
// function only works inside a real Next.js request scope, which Vitest
// doesn't provide, so it's mocked here rather than left to throw. vi.mock
// calls are hoisted above imports by Vitest's transform, so this still
// applies to the static import above.
vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => (name.toLowerCase() === "host" ? mockHost : null),
  }),
}));

afterEach(() => {
  delete process.env.NEXT_PUBLIC_VERCEL_ENV;
  mockHost = "enactus-mannheim.com";
});

describe("robots", () => {
  it("allows crawling on the confirmed production host with NEXT_PUBLIC_VERCEL_ENV=production", async () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
    mockHost = "enactus-mannheim.com";
    const result = await robots();
    expect(result.rules).toMatchObject({ userAgent: "*", allow: "/" });
  });

  it("disallows /api/ and /styleguide in both locales when crawling is allowed", async () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
    mockHost = "enactus-mannheim.com";
    const result = await robots();
    const rules = result.rules as { disallow: string[] };
    expect(rules.disallow).toEqual(expect.arrayContaining(["/api/", "/styleguide", "/en/styleguide"]));
  });

  it("disallows everything when NEXT_PUBLIC_VERCEL_ENV isn't production", async () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
    mockHost = "enactus-mannheim.com";
    const result = await robots();
    expect(result.rules).toEqual({ userAgent: "*", disallow: "/" });
  });

  it("disallows everything when the host isn't the confirmed production domain", async () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
    mockHost = "enactus-mannheim-website.vercel.app";
    const result = await robots();
    expect(result.rules).toEqual({ userAgent: "*", disallow: "/" });
  });

  it("points at the generated sitemap whether crawling is allowed or not", async () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
    mockHost = "enactus-mannheim.com";
    expect((await robots()).sitemap).toMatch(/\/sitemap\.xml$/);

    process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
    expect((await robots()).sitemap).toMatch(/\/sitemap\.xml$/);
  });
});

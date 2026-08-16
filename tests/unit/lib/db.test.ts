import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The regression this guards: `next build` collects route metadata for
 * every API route without ever calling a request handler, so any module
 * that reaches for `process.env.DATABASE_URL` (or builds a Neon client)
 * at import time turns a runtime requirement into a build-time one — and
 * on Vercel that only shows up during an actual deployment. lib/db.ts's
 * client is built lazily specifically to avoid this; this test imports the
 * module with the variable unset and asserts the import itself is fine.
 */
describe("lib/db module import", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    vi.resetModules();
  });

  it("imports without throwing when DATABASE_URL is unset", async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
    await expect(import("@/lib/db")).resolves.toBeDefined();
  });

  it("only throws once a function is actually called, with a clear message", async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
    const { insertContactMessage } = await import("@/lib/db");
    await expect(
      insertContactMessage({ name: "Test", email: "test@example.invalid", message: "Hello", locale: "de" }),
    ).rejects.toThrow(/DATABASE_URL is not set/);
  });
});

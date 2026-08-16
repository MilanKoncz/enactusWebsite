import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Same regression as lib/db.test.ts: `next build` collects route metadata
 * without running a request handler, so lib/mail.ts must not reach for
 * RESEND_API_KEY (or any of the from/reply-to addresses) at import time.
 */
describe("lib/mail module import", () => {
  const originalEnv = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_REPLY_TO_EMAIL: process.env.RESEND_REPLY_TO_EMAIL,
    APPLICATION_RECIPIENT_EMAIL: process.env.APPLICATION_RECIPIENT_EMAIL,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.resetModules();
  });

  function clearMailEnv() {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_REPLY_TO_EMAIL;
    delete process.env.APPLICATION_RECIPIENT_EMAIL;
  }

  it("imports without throwing when no mail env vars are set", async () => {
    clearMailEnv();
    vi.resetModules();
    await expect(import("@/lib/mail")).resolves.toBeDefined();
  });

  it("only throws once a send is actually attempted, with a clear message", async () => {
    clearMailEnv();
    vi.resetModules();
    const { sendContactMessageNotification } = await import("@/lib/mail");
    await expect(
      sendContactMessageNotification({ name: "Test", email: "test@example.invalid", subject: "Hi", text: "Hi" }),
    ).rejects.toThrow(/is not set — see \.env\.example/);
  });
});

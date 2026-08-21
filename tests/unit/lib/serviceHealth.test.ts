import { afterEach, describe, expect, it, vi } from "vitest";

const mailHealthSnapshot = vi.fn();

vi.mock("@/lib/db", () => ({
  mailHealthSnapshot: (...args: unknown[]) => mailHealthSnapshot(...args),
}));

/**
 * checkResend() no longer calls Resend at all — it derives status from
 * mail_status across the mail-tracking tables (lib/db.ts's
 * mailHealthSnapshot), because a send-only-scoped API key 401s on any
 * endpoint that isn't POST /emails, which used to make a merely-restricted
 * key look identical to an expired one.
 */
describe("checkResend", () => {
  const originalKey = process.env.RESEND_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
    mailHealthSnapshot.mockReset();
  });

  it("is red when the key is missing, without querying the database", async () => {
    delete process.env.RESEND_API_KEY;
    const { checkResend } = await import("@/lib/serviceHealth");
    const result = await checkResend();
    expect(result).toEqual({ level: "error", reason: "missingKey", lastAttemptAt: null, failedLast30Days: 0 });
    expect(mailHealthSnapshot).not.toHaveBeenCalled();
  });

  it("is red when the key doesn't look like a Resend key", async () => {
    process.env.RESEND_API_KEY = "not-a-resend-key";
    const { checkResend } = await import("@/lib/serviceHealth");
    const result = await checkResend();
    expect(result).toEqual({ level: "error", reason: "invalidKey", lastAttemptAt: null, failedLast30Days: 0 });
    expect(mailHealthSnapshot).not.toHaveBeenCalled();
  });

  it("is yellow when the key is fine but nothing has ever been sent", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    mailHealthSnapshot.mockResolvedValue({ lastAttempt: null, failedLast30Days: 0 });
    const { checkResend } = await import("@/lib/serviceHealth");
    const result = await checkResend();
    expect(result).toEqual({ level: "warning", reason: "noAttempts", lastAttemptAt: null, failedLast30Days: 0 });
  });

  it("is red when the most recent send attempt failed", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    const at = new Date("2026-08-20T09:00:00Z");
    mailHealthSnapshot.mockResolvedValue({
      lastAttempt: { source: "applications", status: "failed", at },
      failedLast30Days: 3,
    });
    const { checkResend } = await import("@/lib/serviceHealth");
    const result = await checkResend();
    expect(result).toEqual({ level: "error", reason: "lastFailed", lastAttemptAt: at, failedLast30Days: 3 });
  });

  it("is green when the most recent send attempt succeeded, even with older failures", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    const at = new Date("2026-08-20T09:00:00Z");
    mailHealthSnapshot.mockResolvedValue({
      lastAttempt: { source: "reminder_signups", status: "sent", at },
      failedLast30Days: 2,
    });
    const { checkResend } = await import("@/lib/serviceHealth");
    const result = await checkResend();
    expect(result).toEqual({ level: "ok", reason: "lastSucceeded", lastAttemptAt: at, failedLast30Days: 2 });
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

const checkRateLimit = vi.fn();
const sendInsertFailureAlert = vi.fn();

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

vi.mock("@/lib/mail", () => ({
  sendInsertFailureAlert: (...args: unknown[]) => sendInsertFailureAlert(...args),
}));

/**
 * The board's safety net for a form whose database write fails — see
 * lib/insertFailureAlert.ts's own comment on why this exists (the Ideathon
 * signup gap, 2026-08-26 to 2026-08-30, where nobody who could fix it ever
 * found out). These tests exercise the two properties that actually matter:
 * an alert goes out once per rate-limit window, and nothing here ever
 * throws past the caller — a broken alert path must not turn an
 * already-handled failure into an unhandled one.
 */
describe("alertOnInsertFailure", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("sends an alert with the route and the error message", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 0 });
    sendInsertFailureAlert.mockResolvedValue("mail-id");
    const { alertOnInsertFailure } = await import("@/lib/insertFailureAlert");

    await alertOnInsertFailure("ideathon", new Error("column does not exist"));

    expect(checkRateLimit).toHaveBeenCalledWith("insert-failure-alert:ideathon", "board");
    expect(sendInsertFailureAlert).toHaveBeenCalledWith("ideathon", "column does not exist");
  });

  it("sends nothing once the window's alert has already gone out", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
    const { alertOnInsertFailure } = await import("@/lib/insertFailureAlert");

    await alertOnInsertFailure("bewerbung", new Error("connection refused"));

    expect(sendInsertFailureAlert).not.toHaveBeenCalled();
  });

  it("never throws, even when the rate-limit check itself fails", async () => {
    checkRateLimit.mockRejectedValue(new Error("database unreachable"));
    const { alertOnInsertFailure } = await import("@/lib/insertFailureAlert");

    await expect(alertOnInsertFailure("ideathon", new Error("original"))).resolves.toBeUndefined();
  });

  it("never throws, even when the send itself fails", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 0 });
    sendInsertFailureAlert.mockRejectedValue(new Error("Resend is down"));
    const { alertOnInsertFailure } = await import("@/lib/insertFailureAlert");

    await expect(alertOnInsertFailure("ideathon", new Error("original"))).resolves.toBeUndefined();
  });

  it("stringifies a non-Error thrown value instead of failing to build the message", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 0 });
    sendInsertFailureAlert.mockResolvedValue("mail-id");
    const { alertOnInsertFailure } = await import("@/lib/insertFailureAlert");

    await alertOnInsertFailure("ideathon", "a plain string rejection");

    expect(sendInsertFailureAlert).toHaveBeenCalledWith("ideathon", "a plain string rejection");
  });
});

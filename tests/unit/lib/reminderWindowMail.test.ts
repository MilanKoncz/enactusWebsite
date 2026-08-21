// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const claimReminderWindowMail = vi.fn();
const findConfirmedReminderSignups = vi.fn();
const markReminderWindowMailSent = vi.fn();
const markReminderWindowMailFailed = vi.fn();
const dispatchReminderWindowOpen = vi.fn();

vi.mock("@/lib/db", () => ({
  claimReminderWindowMail: (...args: unknown[]) => claimReminderWindowMail(...args),
  findConfirmedReminderSignups: (...args: unknown[]) => findConfirmedReminderSignups(...args),
  markReminderWindowMailSent: (...args: unknown[]) => markReminderWindowMailSent(...args),
  markReminderWindowMailFailed: (...args: unknown[]) => markReminderWindowMailFailed(...args),
}));

vi.mock("@/lib/mailDispatch", () => ({
  dispatchReminderWindowOpen: (...args: unknown[]) => dispatchReminderWindowOpen(...args),
}));

const WINDOW = { id: "window-1", semester: "HWS26", end: "2026-09-13T23:59:00+02:00" };

function signup(id: string) {
  return { id, email: `${id}@example.com`, locale: "de" as const, unsubscribeToken: `unsub-${id}` };
}

/**
 * The property the whole feature exists for: at most one mail per
 * (signup, window), enforced by claimReminderWindowMail's own
 * on-conflict-do-nothing insert — never by anything in this module holding
 * state. These tests exercise sendReminderWindowMailsForWindow purely
 * through that claim's return value (an id, or null for "already claimed"),
 * exactly the contract the real unique constraint gives it.
 */
describe("sendReminderWindowMailsForWindow", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("sends to every signup that successfully claims a row", async () => {
    findConfirmedReminderSignups.mockResolvedValue([signup("a"), signup("b")]);
    claimReminderWindowMail.mockResolvedValueOnce("claim-a").mockResolvedValueOnce("claim-b");
    dispatchReminderWindowOpen.mockResolvedValue(undefined);
    markReminderWindowMailSent.mockResolvedValue(undefined);

    const { sendReminderWindowMailsForWindow } = await import("@/lib/reminderWindowMail");
    const result = await sendReminderWindowMailsForWindow(WINDOW);

    expect(result).toEqual({ sent: 2, failed: 0 });
    expect(dispatchReminderWindowOpen).toHaveBeenCalledTimes(2);
    expect(markReminderWindowMailSent).toHaveBeenCalledWith("claim-a");
    expect(markReminderWindowMailSent).toHaveBeenCalledWith("claim-b");
  });

  it("never dispatches mail for a signup whose claim insert conflicts", async () => {
    findConfirmedReminderSignups.mockResolvedValue([signup("a")]);
    claimReminderWindowMail.mockResolvedValue(null); // already claimed by another run

    const { sendReminderWindowMailsForWindow } = await import("@/lib/reminderWindowMail");
    const result = await sendReminderWindowMailsForWindow(WINDOW);

    expect(result).toEqual({ sent: 0, failed: 0 });
    expect(dispatchReminderWindowOpen).not.toHaveBeenCalled();
  });

  it("running the same window twice never double-sends, given the constraint behaves as it does in production", async () => {
    // The second "run" sees the same signup already claimed — this is
    // exactly what the real unique constraint on
    // (reminder_signup_id, recruiting_window_id) guarantees a second cron
    // run, or the manual-trigger button racing it, would observe.
    findConfirmedReminderSignups.mockResolvedValue([signup("a")]);
    claimReminderWindowMail.mockResolvedValueOnce("claim-a").mockResolvedValueOnce(null);
    dispatchReminderWindowOpen.mockResolvedValue(undefined);
    markReminderWindowMailSent.mockResolvedValue(undefined);

    const { sendReminderWindowMailsForWindow } = await import("@/lib/reminderWindowMail");
    const first = await sendReminderWindowMailsForWindow(WINDOW);
    const second = await sendReminderWindowMailsForWindow(WINDOW);

    expect(first).toEqual({ sent: 1, failed: 0 });
    expect(second).toEqual({ sent: 0, failed: 0 });
    expect(dispatchReminderWindowOpen).toHaveBeenCalledTimes(1);
  });

  it("marks a claimed row failed, not sent, when the mail itself throws", async () => {
    findConfirmedReminderSignups.mockResolvedValue([signup("a")]);
    claimReminderWindowMail.mockResolvedValue("claim-a");
    dispatchReminderWindowOpen.mockRejectedValue(new Error("Resend is down"));
    markReminderWindowMailFailed.mockResolvedValue(undefined);

    const { sendReminderWindowMailsForWindow } = await import("@/lib/reminderWindowMail");
    const result = await sendReminderWindowMailsForWindow(WINDOW);

    expect(result).toEqual({ sent: 0, failed: 1 });
    expect(markReminderWindowMailFailed).toHaveBeenCalledWith("claim-a", "Resend is down");
    expect(markReminderWindowMailSent).not.toHaveBeenCalled();
  });

  it("processes every signup across more than one concurrency batch", async () => {
    const signups = Array.from({ length: 25 }, (_, i) => signup(`s${i}`));
    findConfirmedReminderSignups.mockResolvedValue(signups);
    claimReminderWindowMail.mockImplementation(async (params: { reminderSignupId: string }) => `claim-${params.reminderSignupId}`);
    dispatchReminderWindowOpen.mockResolvedValue(undefined);
    markReminderWindowMailSent.mockResolvedValue(undefined);

    const { sendReminderWindowMailsForWindow } = await import("@/lib/reminderWindowMail");
    const result = await sendReminderWindowMailsForWindow(WINDOW);

    expect(result).toEqual({ sent: 25, failed: 0 });
    expect(dispatchReminderWindowOpen).toHaveBeenCalledTimes(25);
  });

  it("passes the window's own semester and end date into the claim, not a re-derived value", async () => {
    findConfirmedReminderSignups.mockResolvedValue([signup("a")]);
    claimReminderWindowMail.mockResolvedValue("claim-a");
    dispatchReminderWindowOpen.mockResolvedValue(undefined);
    markReminderWindowMailSent.mockResolvedValue(undefined);

    const { sendReminderWindowMailsForWindow } = await import("@/lib/reminderWindowMail");
    await sendReminderWindowMailsForWindow(WINDOW);

    expect(claimReminderWindowMail).toHaveBeenCalledWith({
      reminderSignupId: "a",
      recruitingWindowId: WINDOW.id,
      email: "a@example.com",
      locale: "de",
      semester: WINDOW.semester,
      windowEndsAt: WINDOW.end,
    });
  });
});
